package com.sliit.paf.backend.services;

import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CustomOAuth2UserService
 *
 * ✅ Logic:
 *   - User DB එකේ නැතිනම් → auto-register with ROLE_USER (student default)
 *   - User DB එකේ ඉන්නවා නම් → ඔවුන්ගේ existing roles (ROLE_ADMIN / ROLE_STAFF) use කරනවා
 *
 * Admin/Staff add කිරීම:
 *   MongoDB Atlas → smart_campus_db → users collection →
 *   roles array: ["ROLE_USER", "ROLE_ADMIN"]  or  ["ROLE_USER", "ROLE_STAFF"]
 */
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private static final Logger log = LoggerFactory.getLogger(CustomOAuth2UserService.class);
    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("### CustomOAuth2UserService.loadUser CALLED ###");

        // 1. Google default user details ලබා ගැනීම
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email   = (String) attributes.get("email");
        String name    = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        String googleId = (String) attributes.get("sub");

        log.info("Google Login attempt: {}", email);

        // 2. DB check
        User user = userRepository.findByEmail(email).orElse(null);
        Set<String> finalRoles = new HashSet<>();

        if (user == null) {
            // ✅ New user (student) — auto-register with ROLE_USER
            log.info("New user — auto-registering as ROLE_USER: {}", email);
            user = new User(email, name, picture, googleId);
            finalRoles.add("ROLE_USER");
            user.setRoles(finalRoles);

        } else {
            // ✅ Existing user — use their DB roles (Admin/Staff manually added via Atlas)
            log.info("Existing user: {}. DB roles: {}", email, user.getRoles());
            finalRoles = user.getRoles();

            // Fallback — roles array empty නම්
            if (finalRoles == null || finalRoles.isEmpty()) {
                log.warn("No roles found for {} — assigning ROLE_USER", email);
                finalRoles = new HashSet<>(Set.of("ROLE_USER"));
                user.setRoles(finalRoles);
            }

            // Profile picture / name update
            user.setName(name);
            user.setPicture(picture);
        }

        // 3. Last login update & save
        try {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
            log.info("### DB SAVE SUCCESS | User: {} | Roles: {} ###", email, finalRoles);
        } catch (Exception e) {
            log.error("### DB SAVE FAILED: {} ###", e.getMessage());
        }

        // 4. Spring Security authorities
        Set<GrantedAuthority> authorities = finalRoles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());

        log.info("Final Authorities for {}: {}", email, authorities);

        return new DefaultOAuth2User(authorities, attributes, "email");
    }
}