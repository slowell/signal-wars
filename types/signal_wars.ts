// Placeholder types for Signal Wars
// These will be replaced by the actual IDL types when Anchor is available

export interface SignalWars {
  version: string;
  name: string;
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
    description: string;
  };
  instructions: any[];
  accounts: any[];
  types: any[];
  errors: any[];
}

// Re-export IDL type
export type { SignalWars as default };
