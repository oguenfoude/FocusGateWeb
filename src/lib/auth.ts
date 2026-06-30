import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from './mongodb'
import { User } from './models/User'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        await connectDB()
        const user = await User.findOne({
          username: credentials.username,
          password: credentials.password,
          archivedAt: null,
        }).lean()
        if (!user) return null
        return {
          id: String(user._id),
          name: user.username,
          role: user.role === 0 ? 'admin' : 'user',
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
