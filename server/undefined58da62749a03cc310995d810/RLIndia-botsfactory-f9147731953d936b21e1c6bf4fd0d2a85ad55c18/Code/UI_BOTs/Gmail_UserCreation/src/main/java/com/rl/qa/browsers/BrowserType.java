package com.rl.qa.browsers;

import static com.google.common.base.Strings.isNullOrEmpty;

/**
 * Types of support web browsers.
 */
public enum BrowserType {
    XVFB_FIREFOX,
    REMOTE_FIREFOX,
    REMOTE_CHROME,
    REMOTE_IE,
    FIREFOX,
    CHROME,
    IE,
    HTML_UNIT;

    public static BrowserType fromString(String name) {
        if (isNullOrEmpty(name)) {
            throw new IllegalArgumentException("Required argument 'name' is null/empty!");
        }

        for (BrowserType bt : BrowserType.values()) {
            if (name.equalsIgnoreCase(bt.name())) {
                return bt;
            }
        }

        throw new IllegalArgumentException(String.format("Specified name [%s] is unknown!", name));
    }
}
