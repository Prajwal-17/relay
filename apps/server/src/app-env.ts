export type RelaySessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: RelaySessionUser;
    userId: string;
  };
};
