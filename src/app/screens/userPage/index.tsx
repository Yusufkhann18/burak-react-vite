import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { MemberApiError, updateMember, type Member } from "../../api/member";
import { useAuth } from "../../auth/AuthProvider";
import { readProfile } from "../../components/pages/PageState";
import { ProfileCard } from "../../components/pages/ProfileCard";
import "../../../css/user.css";
export function UserPage() {
  const { member, status } = useAuth();
  if (status === "loading") {
    return (
      <main className="inner-page user-page">
        <div className="page-container"><output>Loading profile…</output></div>
      </main>
    );
  }
  return <ProfileSettings key={member?.id ?? "guest"} member={member} />;
}

function ProfileSettings({ member }: { member: Member | null }) {
  const { setMember, openLogin } = useAuth();
  const [profile, setProfile] = useState(() => member ?? readProfile());
  const [saved, setSaved] = useState(profile);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File>();
  const saveRequest = useRef<AbortController | null>(null);
  const busy = loading || saving;
  useEffect(() => () => saveRequest.current?.abort(), []);

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setMessage("Choose a JPG or PNG image smaller than 2 MB.");
      event.target.value = "";
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, image: String(reader.result) }));
      setImageFile(file);
      setMessage("Image selected. Press SAVE to keep your changes.");
      setLoading(false);
    };
    reader.onerror = () => {
      setMessage("The image could not be read. Please try again.");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (member) {
      const request = new AbortController();
      saveRequest.current = request;
      setSaving(true);
      setMessage("");
      try {
        const updated = await updateMember(profile, imageFile, request.signal);
        if (request.signal.aborted) return;
        setMember(updated);
        setProfile(updated);
        setSaved(updated);
        setImageFile(undefined);
        setMessage("Profile saved.");
      } catch (error) {
        if (request.signal.aborted) return;
        if (error instanceof MemberApiError && (error.status === 401 || error.status === 403)) {
          setMember(null);
          openLogin();
        } else {
          setMessage(error instanceof MemberApiError ? error.message : "Could not save your profile.");
        }
      } finally {
        if (!request.signal.aborted) setSaving(false);
        saveRequest.current = null;
      }
      return;
    }

    try {
      localStorage.setItem("burak-profile-v1", JSON.stringify(profile));
      setSaved(profile);
      setMessage("Profile saved in this browser.");
    } catch {
      setMessage("Could not save the profile. Try a smaller image or allow browser storage.");
    }
  }
  return (
    <main className="inner-page user-page">
      <div className="page-container user-layout">
        <ProfileCard profile={saved} description />
        <form className="profile-form" onSubmit={save}>
          <h1 className="sr-only">My profile</h1>
          <div className="profile-upload">
            <img src={profile.image} alt="Profile preview" />
            <div>
              <label className="upload-button" htmlFor="profile-image">
                Upload image
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/jpeg,image/png"
                onChange={upload}
                disabled={busy}
              />
              <p>JPG, JPEG, PNG format only!</p>
              <small>Maximum 2 MB</small>
            </div>
          </div>
          <div className="profile-fields">
            <label>
              Nickname
              <input
                required
                maxLength={60}
                autoComplete="username"
                disabled={busy}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                maxLength={30}
                autoComplete="tel"
                disabled={busy}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </label>
            <label>
              Address
              <input
                maxLength={200}
                autoComplete="street-address"
                disabled={busy}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows={4}
                maxLength={500}
                disabled={busy}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              />
            </label>
          </div>
          <div className="profile-save">
            <output>{message}</output>
            <button className="page-button" type="submit" disabled={busy}>
              {saving ? "Saving…" : loading ? "Loading…" : "SAVE"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
