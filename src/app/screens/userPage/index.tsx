import { useState, type ChangeEvent, type FormEvent } from "react";
import { readProfile } from "../../components/pages/PageState";
import { ProfileCard } from "../../components/pages/ProfileCard";
import "../../../css/user.css";
export function UserPage() {
  const [profile, setProfile] = useState(readProfile);
  const [saved, setSaved] = useState(profile);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
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
      setMessage("Image selected. Press SAVE to keep your changes.");
      setLoading(false);
    };
    reader.onerror = () => {
      setMessage("The image could not be read. Please try again.");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
                autoComplete="nickname"
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
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                rows={4}
                maxLength={500}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              />
            </label>
          </div>
          <div className="profile-save">
            <p role="status">{message}</p>
            <button className="page-button" type="submit" disabled={loading}>
              {loading ? "Loading…" : "SAVE"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
