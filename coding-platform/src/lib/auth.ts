import { db } from "../db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { JWTPayload, SignJWT, importJWK } from "jose";
import { Session } from "next-auth";

interface token extends JWT {
  uid: string;
  jwtToken: string;
}

export interface session extends Session {
  user: {
    id: string;
    jwtToken: string;
    email: string;
    name: string;
  };
}
interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

const generateJWT = async (payload: JWTPayload) => {
  const secret = process.env.JWT_SECRET || "secret";

  const jwk = await importJWK({ k: secret, alg: "HS256", kty: "oct" });

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(jwk);

  return jwt;
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "email", type: "text", placeholder: "enter email" },
        names: { label: "name", type: "text", placeholder: "enter Name" },
        password: { label: "password", type: "password", placeholder: "******" },
        authType: { label: "authType", type: "text" }, // login | signup
        
      },
      async authorize(credentials: any) { 
        console.log("doing singuJLKFADSFFFFFFFFFFFFFFFFFFFFFFFFFFFAKJDSFHKALJDDDDDDDDDDDDDDDDDHp")
        console.log(credentials.names)


        const hashedPassword = await bcrypt.hash(credentials.password, 10);

        const userDb = await db.user.findFirst({
          where: {
            email: credentials.username,
          },
          select: {
            password: true,
            id: true,
            name: true,
          },
        });
        if(credentials.authType === "login"){
          if (userDb) {
            if (await bcrypt.compare(credentials.password, userDb.password)) {
              const jwt = await generateJWT({
                id: userDb.id,
              });
              
              return {
                id: userDb.id,
                name: userDb.name,
                email: credentials.username,
                token: jwt,
              };
            } else {
              return null;
            }
          }
          else 
          return null;
        }
          try {
          // sign up
          const user = await db.user.create({
            data: {
              email: credentials.username,
              name: credentials.username,
              password: hashedPassword,
            },
          });

          const jwt = await generateJWT({
            id: user.id,
          });

          return {
            id: user.id,
            name: credentials.names,
            email: credentials.username,
            token: jwt,
          };
        } catch (e) {
          return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "secr3t",
  callbacks: {
    session: async ({ session, token }) => {
      const newSession: session = session as session;
      if (newSession.user && token.uid) {
        newSession.user.id = token.uid as string;
        newSession.user.jwtToken = token.jwtToken as string;
      }
      return newSession!;
    },
    jwt: async ({ token, user }): Promise<JWT> => {
      const newToken = token;

      if (user) {
        newToken.uid = user.id;
        newToken.jwtToken = (user as User).token;
      }
      return newToken;
    },
  },
} satisfies NextAuthOptions;
