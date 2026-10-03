package com.bookmycourt.common.recovery;

import java.util.List;

public interface Rebuildable {
    String name();
    void rebuild();
    List<String> verify();
}
