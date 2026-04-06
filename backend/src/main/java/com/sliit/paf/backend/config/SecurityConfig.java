package com.sliit.paf.backend.config;

import com.sliit.paf.backend.services.CustomOAuth2UserService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final CustomOAuth2UserService customOAuth2UserService;
    private final JwtProperties jwtProperties;
    private final ClientRegistrationRepository clientRegistrationRepository;

    public SecurityConfig(CustomOAuth2UserService customOAuth2UserService,
                          JwtProperties jwtProperties,
                          ClientRegistrationRepository clientRegistrationRepository) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.jwtProperties = jwtProperties;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    // OAuth2 user login weddi JWT generate karanna (Google login flow)
    public String generateToken(OAuth2User oauthUser) {
        String email = oauthUser.getAttribute("email");

        List<String> roles = oauthUser.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(role -> role.startsWith("ROLE_"))
                .distinct()
                .collect(Collectors.toList());

        if (roles.isEmpty()) {
            log.warn("No roles found for {} - falling back to ROLE_USER", email);
            roles.add("ROLE_USER");
        }

        log.info("Generating JWT for: {} | Roles: {}", email, roles);

        return Jwts.builder()
                .setSubject(email)
                .claim("roles", roles)
                .claim("name", oauthUser.getAttribute("name"))
                .claim("picture", oauthUser.getAttribute("picture"))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Username/Password login weddi JWT generate karanna (local login flow)
    public String generateTokenForLocalUser(String email, Set<String> roles, String name) {
        List<String> roleList = new ArrayList<>(roles);

        log.info("Generating JWT for local user: {} | Roles: {}", email, roleList);

        return Jwts.builder()
                .setSubject(email)
                .claim("roles", roleList)
                .claim("name", name)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtProperties.getExpiration()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // BCrypt password encoder bean
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private OAuth2AuthorizationRequestResolver customAuthorizationRequestResolver() {
        DefaultOAuth2AuthorizationRequestResolver defaultResolver =
                new DefaultOAuth2AuthorizationRequestResolver(
                        clientRegistrationRepository,
                        "/oauth2/authorization"
                );

        return new OAuth2AuthorizationRequestResolver() {
            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
                return addPromptSelectAccount(defaultResolver.resolve(request));
            }

            @Override
            public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
                return addPromptSelectAccount(defaultResolver.resolve(request, clientRegistrationId));
            }

            private OAuth2AuthorizationRequest addPromptSelectAccount(OAuth2AuthorizationRequest request) {
                if (request == null) return null;
                Map<String, Object> extraParams = new LinkedHashMap<>(request.getAdditionalParameters());
                extraParams.put("prompt", "select_account");
                return OAuth2AuthorizationRequest.from(request)
                        .additionalParameters(extraParams)
                        .build();
            }
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Auth endpoints (register, login) - public
                .requestMatchers("/api/auth/**").permitAll()
                // OAuth2 endpoints - public
                .requestMatchers("/oauth2/**", "/login/**", "/error").permitAll()
                // Resources GET - public
                .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()
                // Notifications - authenticated users only
                .requestMatchers("/api/notifications/**").authenticated()
                // Current user profile - authenticated
                .requestMatchers("/api/users/me").authenticated()
                // User management - ADMIN only
                .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(handling -> handling
                .authenticationEntryPoint((request, response, authException) -> {
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\":\"Unauthorized\",\"status\":401}");
                    } else {
                        response.sendRedirect("http://localhost:3000/login");
                    }
                })
                .accessDeniedHandler((request, response, denied) -> {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Forbidden\",\"status\":403}");
                })
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(endpoint ->
                    endpoint.authorizationRequestResolver(customAuthorizationRequestResolver())
                )
                .userInfoEndpoint(info -> info.userService(customOAuth2UserService))
                .successHandler((request, response, authentication) -> {
                    try {
                        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
                        log.info("OAuth2 login success. Authorities: {}", oauthUser.getAuthorities());
                        String token = generateToken(oauthUser);
                        response.sendRedirect("http://localhost:3000/oauth-callback?token=" + token);
                    } catch (Exception e) {
                        log.error("OAuth2 SuccessHandler error", e);
                        response.sendRedirect("http://localhost:3000/login?error=auth_error");
                    }
                })
                .failureHandler((request, response, exception) -> {
                    log.error("OAuth2 Login Failed: {}", exception.getMessage());
                    response.sendRedirect("http://localhost:3000/login?error=oauth_failed");
                })
            )
            .addFilterBefore(createJwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private OncePerRequestFilter createJwtAuthFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(
                    @NonNull HttpServletRequest request,
                    @NonNull HttpServletResponse response,
                    @NonNull FilterChain filterChain)
                    throws ServletException, IOException {

                String header = request.getHeader("Authorization");
                if (header != null && header.startsWith("Bearer ")) {
                    String token = header.substring(7);
                    try {
                        Claims claims = Jwts.parserBuilder()
                                .setSigningKey(getSigningKey())
                                .build()
                                .parseClaimsJws(token)
                                .getBody();

                        String email = claims.getSubject();
                        List<String> roles = claims.get("roles", List.class);

                        if (email != null && roles != null) {
                            List<SimpleGrantedAuthority> authorities = roles.stream()
                                    .map(SimpleGrantedAuthority::new)
                                    .collect(Collectors.toList());

                            UsernamePasswordAuthenticationToken auth =
                                    new UsernamePasswordAuthenticationToken(email, null, authorities);
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    } catch (Exception e) {
                        log.warn("JWT Verification Failed: {}", e.getMessage());
                        SecurityContextHolder.clearContext();
                    }
                }
                filterChain.doFilter(request, response);
            }
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Cache-Control"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}