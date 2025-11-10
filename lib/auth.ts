import type { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";

const API_BASE_URL = process.env.API_BASE_URL;
const MAESTRO_SECRET_TOKEN = process.env.MAESTRO_SECRET_TOKEN;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL environment variable is not set.");
}

if (!MAESTRO_SECRET_TOKEN) {
  throw new Error("MAESTRO_SECRET_TOKEN environment variable is not set.");
}

const API_BASE_URL_VALUE = API_BASE_URL;
const MAESTRO_SECRET_TOKEN_VALUE = MAESTRO_SECRET_TOKEN;

type MaestroLoginResponse = {
  status: number;
  data?: {
    name?: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: "Bearer";
  };
};

type MaestroUser = {
  id: string;
  name?: string | null;
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type MaestroToken = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  username?: string;
  name?: string | null;
  email?: string | null;
  error?: string;
} & Record<string, unknown>;

type MaestroSession = Session & {
  user: NonNullable<Session["user"]> & {
    username?: string;
    accessToken?: string;
  };
  tokens?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  };
};

async function refreshAccessToken(token: MaestroToken): Promise<MaestroToken> {
  try {
    const refreshToken = typeof token.refreshToken === "string" ? token.refreshToken : undefined;

    if (!refreshToken) {
      throw new Error("Missing refresh token");
    }

    const response = await fetch(`${API_BASE_URL_VALUE}/Auth/RefreshTokenLogin`, {
      method: "POST",
      headers: {
        Authorization: MAESTRO_SECRET_TOKEN_VALUE,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token");
    }

    const data: MaestroLoginResponse = await response.json();

    if (!data?.data?.accessToken) {
      throw new Error("Invalid refresh token response");
    }

    const expiresAt = Date.now() + data.data.expiresIn * 1000;

    return {
      ...token,
      accessToken: data.data.accessToken,
      refreshToken: data.data.refreshToken ?? token.refreshToken,
      expiresAt,
      error: undefined,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError" as const,
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        username: {
          label: "Kullanıcı Adı",
          type: "text",
        },
        password: {
          label: "Şifre",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const response = await fetch(`${API_BASE_URL_VALUE}/Auth/Login`, {
          method: "POST",
          headers: {
            Authorization: MAESTRO_SECRET_TOKEN_VALUE,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const payload: MaestroLoginResponse = await response.json();
        const tokens = payload?.data;

        if (!tokens?.accessToken) {
          return null;
        }

        const maestroUser: MaestroUser = {
          id: "maestro-user",
          name: tokens.name ?? "User",
          username: credentials.username,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        };

        return maestroUser;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const maestroUser = user as MaestroUser;
        const expiresAt = Date.now() + maestroUser.expiresIn * 1000;

        const nextToken: MaestroToken = {
          ...token,
          username: maestroUser.username,
          accessToken: maestroUser.accessToken,
          refreshToken: maestroUser.refreshToken,
          expiresAt,
          error: undefined,
        };

        return nextToken;
      }

      const expiresAt = typeof token.expiresAt === "number" ? token.expiresAt : 0;

      if (expiresAt && Date.now() < expiresAt - 60 * 1000) {
        return token as MaestroToken;
      }

      return refreshAccessToken(token as MaestroToken);
    },
    async session({ session, token }) {
      const maestroSession = session as MaestroSession;
      const username =
        typeof token.username === "string" ? token.username : undefined;
      const accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      const refreshToken =
        typeof token.refreshToken === "string" ? token.refreshToken : undefined;
      const expiresAt =
        typeof token.expiresAt === "number" ? token.expiresAt : undefined;
      const error =
        typeof token.error === "string" ? token.error : undefined;

      maestroSession.user = maestroSession.user ?? {
        name: token.name ?? null,
        email: null,
      };

      maestroSession.user.username = username;
      maestroSession.user.accessToken = accessToken;

      maestroSession.tokens = {
        accessToken,
        refreshToken,
        expiresAt,
        error,
      };

      return maestroSession;
    },
  },
};

export const auth = () => getServerSession(authOptions);

