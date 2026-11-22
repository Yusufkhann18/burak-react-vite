import { readProfile, type Profile } from "./PageState";
import { useAuth } from "../../auth/AuthProvider";
export function ProfileCard({
  profile: suppliedProfile,
  description = false,
}: {
  profile?: Profile;
  description?: boolean;
}) {
  const { member } = useAuth();
  const profile = suppliedProfile ?? member ?? readProfile();
  return (
    <aside className="profile-card">
      <div className="profile-avatar">
        <img src={profile.image} alt={profile.name} />
        <img className="profile-badge" src="/icons/user-badge.svg" alt="" />
      </div>
      <h2>{profile.name}</h2>
      <p className="profile-role">USER</p>
      {description && <p>{profile.description}</p>}
      <p className="profile-address">
        <img src="/icons/location.svg" alt="" />
        {profile.address}
      </p>
    </aside>
  );
}
