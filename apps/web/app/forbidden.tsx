import { ForbiddenCard } from "@/components/fgac/forbidden-card"

// Next.js 16 `forbidden` boundary. Pages call `forbidden()` from next/navigation
// when OpenFGA denies the capability the route requires.
export default function Forbidden() {
  return <ForbiddenCard />
}
