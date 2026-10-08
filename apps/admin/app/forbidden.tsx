import { ForbiddenCard } from "@/components/forbidden-card"

// Next.js 16 `forbidden` boundary. Pages call `forbidden()` when the user does
// not hold the OpenFGA capability the admin console requires.
export default function Forbidden() {
  return <ForbiddenCard />
}
