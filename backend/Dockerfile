# Multi-stage build for Spring Boot Backend on Java 21
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Copy Maven wrapper and dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x ./mvnw
RUN ./mvnw dependency:go-offline -B

# Build the application jar
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# Runtime image
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Dynamic port for Railway/Cloud deployments
ENV PORT=8081
EXPOSE 8081

# Optimize memory for containerized environments
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
