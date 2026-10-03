package com.bookmycourt.common.idempotency;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
@Order(10)
public class IdempotencyFilter extends OncePerRequestFilter {

    public static final String IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

    private final IdempotencyService idempotencyService;
    private final ConcurrentHashMap<String, CompletableFuture<IdempotencyService.StoredResponse>> inFlight = new ConcurrentHashMap<>();

    public IdempotencyFilter(IdempotencyService idempotencyService) {
        this.idempotencyService = idempotencyService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !(path.startsWith("/api/bookings") ||
                path.startsWith("/api/payments") ||
                path.startsWith("/api/shop/orders") ||
                path.startsWith("/api/bar/orders") ||
                path.startsWith("/api/bar/tabs") ||
                path.startsWith("/api/dues") ||
                path.startsWith("/api/memberships") ||
                path.startsWith("/api/refunds"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String idemKey = request.getHeader(IDEMPOTENCY_KEY_HEADER);
        if (idemKey == null || idemKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        idemKey = idemKey.trim();
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request, 1024 * 1024);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        // Force reading input stream so content caching wrapper buffers body
        byte[] requestBody = wrappedRequest.getInputStream().readAllBytes();
        String requestHash = IdempotencyService.computeHash(requestBody);

        String method = request.getMethod().toUpperCase();
        String path = request.getRequestURI();
        String flightKey = idemKey + ":" + method + ":" + path;

        // Check if existing record exists
        Optional<IdempotencyRecord> existing = idempotencyService.find(idemKey, method, path);
        if (existing.isPresent()) {
            IdempotencyRecord record = existing.get();
            if (!record.getRequestHash().equals(requestHash)) {
                response.setStatus(422);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"success\":false,\"error\":\"IDEMPOTENCY_KEY_REUSED: Request body does not match original request\"}");
                return;
            }
            response.setStatus(record.getStatusCode());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            if (record.getResponseBody() != null) {
                response.getWriter().write(record.getResponseBody());
            }
            return;
        }

        // Handle in-flight requests with same key
        CompletableFuture<IdempotencyService.StoredResponse> promise = new CompletableFuture<>();
        CompletableFuture<IdempotencyService.StoredResponse> active = inFlight.putIfAbsent(flightKey, promise);

        if (active != null) {
            try {
                IdempotencyService.StoredResponse stored = active.get(15, TimeUnit.SECONDS);
                response.setStatus(stored.statusCode());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                if (stored.responseBody() != null) {
                    response.getWriter().write(stored.responseBody());
                }
                return;
            } catch (Exception e) {
                response.setStatus(503);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"success\":false,\"error\":\"SYSTEM_BUSY: Idempotent in-flight request timed out\"}");
                return;
            }
        }

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            int statusCode = wrappedResponse.getStatus();
            byte[] responseBytes = wrappedResponse.getContentAsByteArray();
            String responseBody = new String(responseBytes, StandardCharsets.UTF_8);

            idempotencyService.save(idemKey, method, path, requestHash, statusCode, responseBody);
            promise.complete(new IdempotencyService.StoredResponse(statusCode, responseBody));

            wrappedResponse.copyBodyToResponse();
        } catch (Throwable t) {
            promise.completeExceptionally(t);
            throw t;
        } finally {
            inFlight.remove(flightKey);
        }
    }
}
