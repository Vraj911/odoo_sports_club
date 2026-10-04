package com.bookmycourt.common.actor;

import java.util.UUID;

public record Actor(UUID userId, String name, ActorRole role) {

    public static final UUID SYSTEM_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final Actor SYSTEM = new Actor(SYSTEM_ID, "System", ActorRole.SYSTEM);

    public boolean isManagerOrAbove() {
        return role == ActorRole.MANAGER;
    }
}
