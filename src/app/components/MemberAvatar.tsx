import { useState } from "react"
import { defaultMemberAvatar } from "../api/member"

type MemberAvatarProps = {
  src: string
  alt?: string
  className?: string
  loading?: "eager" | "lazy"
}

export function MemberAvatar(props: MemberAvatarProps) {
  return <AvatarImage key={props.src} {...props} />
}

function AvatarImage({ src, alt = "", className, loading }: MemberAvatarProps) {
  const [failed, setFailed] = useState(false)

  return (
    <img
      src={failed ? defaultMemberAvatar : src}
      alt={alt}
      className={className}
      loading={loading}
      onError={failed || src === defaultMemberAvatar ? undefined : () => setFailed(true)}
    />
  )
}
