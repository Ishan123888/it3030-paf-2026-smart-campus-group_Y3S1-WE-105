package com.sliit.paf.backend.controllers;

import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/otp")
public class OTPController {

    private static final Map<String, String> otpStore = new HashMap<>();
    private static final String WACLIENT_API_URL = "https://waclient.com/api/send";
    private static final String INSTANCE_ID      = "69E11D13B68E7";
    private static final String ACCESS_TOKEN     = "69e11cf14a61a";

    @PostMapping("/send")
    public Map<String, Object> sendOTP(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String phone = request.get("phone");
            if (phone == null || phone.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "Phone number is required");
                return response;
            }

            String formattedPhone = formatPhoneNumber(phone);
            String otp = generateOTP();
            otpStore.put(formattedPhone, otp);

            System.out.println("=== OTP SEND ===");
            System.out.println("Raw phone    : " + phone);
            System.out.println("Formatted    : " + formattedPhone);
            System.out.println("OTP          : " + otp);

            String apiResponse = sendViaWhatsApp(formattedPhone, otp);
            System.out.println("WaClient resp: " + apiResponse);
            System.out.println("================");

            response.put("success", true);
            response.put("message", "OTP sent to WhatsApp");
        } catch (Exception e) {
            System.err.println("OTP send error: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("error", "Server error: " + e.getMessage());
        }
        return response;
    }

    @PostMapping("/verify")
    public Map<String, Object> verifyOTP(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            String phone = request.get("phone");
            String otp   = request.get("otp");
            if (phone == null || phone.trim().isEmpty() || otp == null || otp.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "Phone and OTP are required");
                return response;
            }
            String formattedPhone = formatPhoneNumber(phone);
            String storedOTP = otpStore.get(formattedPhone);

            System.out.println("=== OTP VERIFY ===");
            System.out.println("Formatted : " + formattedPhone);
            System.out.println("Entered   : " + otp);
            System.out.println("Stored    : " + storedOTP);
            System.out.println("Store map : " + otpStore);
            System.out.println("==================");

            if (storedOTP != null && storedOTP.equals(otp)) {
                otpStore.remove(formattedPhone);
                response.put("success", true);
                response.put("message", "OTP verified successfully");
            } else {
                response.put("success", false);
                response.put("error", "Invalid OTP");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return response;
    }

    private String sendViaWhatsApp(String phone, String otp) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String message = "SmartCampus Admin Verification\n\nYour OTP is: *" + otp + "*\nValid for 5 minutes. Do not share this code.";

            // Send as form-encoded (WaClient expects this)
            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("number",       phone);
            params.add("type",         "text");
            params.add("message",      message);
            params.add("instance_id",  INSTANCE_ID);
            params.add("access_token", ACCESS_TOKEN);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<String> resp = restTemplate.postForEntity(
                WACLIENT_API_URL,
                new HttpEntity<>(params, headers),
                String.class
            );
            return resp.getBody();
        } catch (Exception e) {
            System.err.println("WaClient error: " + e.getMessage());
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    private String generateOTP() {
        return String.format("%06d", (int) (Math.random() * 1_000_000));
    }

    private String formatPhoneNumber(String phone) {
        phone = phone.replaceAll("[\\s\\-+]", "");
        if (phone.startsWith("0"))        phone = "94" + phone.substring(1);
        else if (!phone.startsWith("94")) phone = "94" + phone;
        return phone;
    }
}
