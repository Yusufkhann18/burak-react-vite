import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Redirect } from "react-router-dom";
import { MemberApiError, updateMember } from "../../api/member";
import type { Member } from "../../api/member";
import { useAuth } from "../../auth/AuthProvider";
import { ProfileCard } from "../../components/pages/ProfileCard";
import "../../../css/user.css";

export function UserPage() {
  const { member, status, openLogin } = useAuth();
  if (member) return <ProfileSettings key={member.id} member={member} />;
  if (status === "guest") return <Redirect to="/" />;
  if (status === "loading") {
    return (
      <main className="inner-page user-page">
        <div className="page-container"><output>Loading profile…</output></div>
      </main>
    );
  }
  return (
    <main className="inner-page user-page">
      <div className="page-container">
        <p role="alert">Could not check your session.</p>
        <button className="page-button" type="button" onClick={openLogin}>Log in</button>
      </div>
    </main>
  );
}

function ProfileSettings({ member }: { member: Member }) {
  const { setMember, openLogin } = useAuth();
  const [profile, setProfile] = useState(member);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<{ file: File; preview: string }>();
  const imageInput = useRef<HTMLInputElement>(null);
  const imageReader = useRef<FileReader | null>(null);
  const saveRequest = useRef<AbortController | null>(null);
  const busy = loading || saving;
  useEffect(() => () => {
    imageReader.current?.abort();
    saveRequest.current?.abort();
  }, []);

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || imageReader.current || saveRequest.current) return;
    const validExtension = /\.(jpe?g|png)$/i.test(file.name);
    const validType = !file.type || ["image/jpeg", "image/jpg", "image/png"].includes(file.type);
    if (!validExtension || !validType || file.size > 2 * 1024 * 1024) {
      setMessage("Choose a JPG, JPEG, or PNG image up to 2 MB.");
      setImage(undefined);
      input.value = "";
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    imageReader.current = reader;
    reader.onload = () => {
      setImage({ file, preview: String(reader.result) });
      setMessage("Image selected. Press SAVE to keep your changes.");
    };
    reader.onerror = () => {
      setImage(undefined);
      setMessage("The image could not be read. Please try again.");
      input.value = "";
    };
    reader.onloadend = () => {
      imageReader.current = null;
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || imageReader.current || saveRequest.current) return;
    const fields = {
      name: profile.name.trim(),
      phone: profile.phone.trim(),
      address: profile.address.trim(),
      description: profile.description.trim(),
    };
    if (Object.values(fields).some((value) => !value)) {
      setMessage("Complete all required fields.");
      return;
    }

    const request = new AbortController();
    saveRequest.current = request;
    setSaving(true);
    setMessage("");
    try {
      const updated = await updateMember(fields, image?.file, request.signal);
      if (request.signal.aborted) return;
      setMember(updated);
      setProfile(updated);
      setImage(undefined);
      if (imageInput.current) imageInput.current.value = "";
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
  }

  return (
    <main className="inner-page user-page">
      <div className="page-container user-layout">
        <ProfileCard description />
        <form className="profile-form" aria-busy={busy} onSubmit={save}>
          <h1 className="sr-only">My profile</h1>
          <div className="profile-upload">
            <img src={image?.preview ?? member.image} alt="Profile preview" />
            <div>
              <label className="upload-button" htmlFor="profile-image">
                Upload image
              </label>
              <input
                id="profile-image"
                ref={imageInput}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
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
                required
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
                required
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
                required
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
