
import * as React from "react";

const FAMILY_KEY = "family_info";

export function useFamilySettings() {
  const [family, setFamily] = React.useState(() => {
    // Initial read from localStorage
    return localStorage.getItem(FAMILY_KEY) || "";
  });

  // Save to localStorage when family changes
  const setFamilyAndPersist = (value: string) => {
    setFamily(value);
    localStorage.setItem(FAMILY_KEY, value);
  };

  return { family, setFamily: setFamilyAndPersist };
}
