import { useAuth } from "../../auth/AuthProvider";

export function ProfileCard({ description = false }: { description?: boolean }) {
  const { member } = useAuth();
  if (!member) return null;

  const role = member.type;
  const badge = role === "RESTAURANT" ? "/icons/restaurant.svg" : "/icons/user-badge.svg";

  return (
    <aside className="profile-card">
      <div className="profile-avatar">
        <img src={member.image} alt="" />
        <img className="profile-badge" src={badge} alt="" />
      </div>
      <h2>{member.name}</h2>
      {role && <p className="profile-role">{role}</p>}
      {description && <p>{member.description.trim() || "No description provided"}</p>}
      <p className="profile-address">
        <img src="/icons/location.svg" alt="" />
        <span>{member.address.trim() || "No address provided"}</span>
      </p>
    </aside>
  );
}
