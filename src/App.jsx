import { useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, db } from "./firebase";

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";


function App() {
  // =========================
  // BASIC STATES
  // =========================

  const [page, setPage] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  // =========================
  // PROFILE STATES
  // =========================

  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    skills: "",
    hobbies: "",
  });


  // =========================
  // HOBBY & SKILL STATES
  // =========================

  const [skill, setSkill] = useState("");
  const [hobby, setHobby] = useState("");


  // =========================
  // GOAL STATES
  // =========================

  const [goal, setGoal] = useState("");


  // =========================
  // PRACTICE SESSION STATES
  // =========================

  const [activity, setActivity] = useState("");
  const [duration, setDuration] = useState("");


  // =========================
  // COMMUNITY STATES
  // =========================

  const [postText, setPostText] = useState("");
  const [posts, setPosts] = useState([]);

  const [likedPosts, setLikedPosts] = useState({});

  const [commentText, setCommentText] = useState({});
  const [comments, setComments] = useState({});


  // ==================================================
  // LOGIN / REGISTER
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (page === "login") {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        setPage("dashboard");
      } else {
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        setPage("dashboard");
      }
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      setPage("login");
      setEmail("");
      setPassword("");
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // SAVE PROFILE
  // ==================================================

  const handleSaveProfile = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login first.");
        return;
      }

      await setDoc(doc(db, "users", user.uid), {
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills,
        hobbies: profile.hobbies,
        email: user.email,
      });

      alert("Profile saved successfully!");
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOAD PROFILE
  // ==================================================

  const handleLoadProfile = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      );

      if (userDoc.exists()) {
        const data = userDoc.data();

        setProfile({
          name: data.name || "",
          bio: data.bio || "",
          skills: data.skills || "",
          hobbies: data.hobbies || "",
        });
      }
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOAD PROFILE WHEN PROFILE PAGE OPENS
  // ==================================================

  useEffect(() => {
    if (page === "profile") {
      handleLoadProfile();
    }
  }, [page]);


  // ==================================================
  // CREATE COMMUNITY POST
  // ==================================================

  const handleCreatePost = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login first.");
        return;
      }

      if (!postText.trim()) {
        alert("Please write something first.");
        return;
      }

      await addDoc(collection(db, "posts"), {
        text: postText,
        userId: user.uid,
        email: user.email,
        likes: 0,
        createdAt: serverTimestamp(),
      });

      setPostText("");

      alert("Post shared successfully!");

      await handleLoadPosts();
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOAD COMMUNITY POSTS
  // ==================================================

  const handleLoadPosts = async () => {
    try {
      const postsSnapshot = await getDocs(
        collection(db, "posts")
      );

      const postsData = postsSnapshot.docs.map(
        (postDoc) => ({
          id: postDoc.id,
          ...postDoc.data(),
        })
      );

      setPosts(postsData);
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOAD POSTS WHEN COMMUNITY PAGE OPENS
  // ==================================================

  useEffect(() => {
    if (page === "community") {
      handleLoadPosts();
    }
  }, [page]);


  // ==================================================
  // LIKE POST
  // ==================================================

  const handleLikePost = async (postId) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login first.");
        return;
      }

      if (likedPosts[postId]) {
        return;
      }

      const postRef = doc(db, "posts", postId);

      const postDoc = await getDoc(postRef);

      if (postDoc.exists()) {
        const data = postDoc.data();

        const currentLikes = data.likes || 0;

        await setDoc(
          postRef,
          {
            likes: currentLikes + 1,
          },
          {
            merge: true,
          }
        );

        setLikedPosts((previous) => ({
          ...previous,
          [postId]: true,
        }));

        await handleLoadPosts();
      }
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // ADD COMMENT
  // ==================================================

  const handleAddComment = async (postId) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login first.");
        return;
      }

      const text = commentText[postId]?.trim();

      if (!text) {
        alert("Please write a comment.");
        return;
      }

      await addDoc(
        collection(
          db,
          "posts",
          postId,
          "comments"
        ),
        {
          text: text,
          userId: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
        }
      );

      setCommentText((previous) => ({
        ...previous,
        [postId]: "",
      }));

      alert("Comment added successfully!");

      await handleLoadComments(postId);
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOAD COMMENTS
  // ==================================================

  const handleLoadComments = async (postId) => {
    try {
      const commentsSnapshot = await getDocs(
        collection(
          db,
          "posts",
          postId,
          "comments"
        )
      );

      const commentsData = commentsSnapshot.docs.map(
        (commentDoc) => ({
          id: commentDoc.id,
          ...commentDoc.data(),
        })
      );

      setComments((previous) => ({
        ...previous,
        [postId]: commentsData,
      }));
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOAD COMMENTS FOR POSTS
  // ==================================================

  useEffect(() => {
    if (page === "community") {
      posts.forEach((post) => {
        handleLoadComments(post.id);
      });
    }
  }, [page, posts]);


  // ==================================================
  // SAVE GOAL
  // ==================================================

  const handleSaveGoal = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login first.");
        return;
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          goal: goal,
        },
        {
          merge: true,
        }
      );

      alert("Goal saved successfully!");
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOAD GOAL
  // ==================================================

  const handleLoadGoal = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      );

      if (userDoc.exists()) {
        const data = userDoc.data();

        setGoal(data.goal || "");
      }
    } catch (error) {
      alert(error.message);
    }
  };


  useEffect(() => {
    if (page === "goals") {
      handleLoadGoal();
    }
  }, [page]);


  // ==================================================
  // SAVE PRACTICE SESSION
  // ==================================================

  const handleSaveSession = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        alert("Please login first.");
        return;
      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          practiceActivity: activity,
          practiceDuration: duration,
        },
        {
          merge: true,
        }
      );

      alert("Practice session saved successfully!");
    } catch (error) {
      alert(error.message);
    }
  };


  // ==================================================
  // LOAD PRACTICE SESSION
  // ==================================================

  const handleLoadSession = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      );

      if (userDoc.exists()) {
        const data = userDoc.data();

        setActivity(data.practiceActivity || "");
        setDuration(data.practiceDuration || "");
      }
    } catch (error) {
      alert(error.message);
    }
  };


  useEffect(() => {
    if (page === "practice") {
      handleLoadSession();
    }
  }, [page]);


  // ==================================================
  // LOAD PROGRESS
  // ==================================================

  const handleLoadProgress = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      );

      if (userDoc.exists()) {
        const data = userDoc.data();

        setGoal(data.goal || "");

        setActivity(
          data.practiceActivity || ""
        );

        setDuration(
          data.practiceDuration || ""
        );
      }
    } catch (error) {
      alert(error.message);
    }
  };


  useEffect(() => {
    if (page === "progress") {
      handleLoadProgress();
    }
  }, [page]);


  // ==================================================
  // LOAD HOBBIES & SKILLS
  // ==================================================

  const handleLoadHobbies = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        return;
      }

      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      );

      if (userDoc.exists()) {
        const data = userDoc.data();

        setSkill(data.skills || "");
        setHobby(data.hobbies || "");

        setProfile((previous) => ({
          ...previous,
          skills: data.skills || "",
          hobbies: data.hobbies || "",
        }));
      }
    } catch (error) {
      alert(error.message);
    }
  };


  useEffect(() => {
    if (page === "hobbies") {
      handleLoadHobbies();
    }
  }, [page]);


  // ==================================================
  // PROFILE PAGE
  // ==================================================

  if (page === "profile") {
    return (
      <div>
        <h1>My Profile 👤</h1>

        <input
          type="text"
          placeholder="Enter your name"
          value={profile.name}
          onChange={(e) =>
            setProfile({
              ...profile,
              name: e.target.value,
            })
          }
        />

        <br />
        <br />

        <textarea
          placeholder="Write a short bio"
          value={profile.bio}
          onChange={(e) =>
            setProfile({
              ...profile,
              bio: e.target.value,
            })
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Enter your skills"
          value={profile.skills}
          onChange={(e) =>
            setProfile({
              ...profile,
              skills: e.target.value,
            })
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Enter your hobbies"
          value={profile.hobbies}
          onChange={(e) =>
            setProfile({
              ...profile,
              hobbies: e.target.value,
            })
          }
        />

        <br />
        <br />

        <button onClick={handleSaveProfile}>
          Save Profile
        </button>

        <br />
        <br />

        <button
          onClick={() => setPage("dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }


  // ==================================================
  // HOBBIES & SKILLS PAGE
  // ==================================================

  if (page === "hobbies") {
    return (
      <div>
        <h1>My Hobbies & Skills 🎯</h1>

        <h2>My Skills</h2>

        <p>
          Add and manage your skills here.
        </p>

        <input
          type="text"
          placeholder="Enter a skill"
          value={skill}
          onChange={(e) =>
            setSkill(e.target.value)
          }
        />

        <br />
        <br />

        <button
          onClick={() =>
            setProfile({
              ...profile,
              skills: skill,
            })
          }
        >
          Add Skill
        </button>

        {profile.skills && (
          <p>
            <strong>My Skill:</strong>{" "}
            {profile.skills}
          </p>
        )}


        <h2>My Hobbies</h2>

        <p>
          Add and manage your hobbies here.
        </p>

        <input
          type="text"
          placeholder="Enter a hobby"
          value={hobby}
          onChange={(e) =>
            setHobby(e.target.value)
          }
        />

        <br />
        <br />

        <button
          onClick={() =>
            setProfile({
              ...profile,
              hobbies: hobby,
            })
          }
        >
          Add Hobby
        </button>

        {profile.hobbies && (
          <p>
            <strong>My Hobby:</strong>{" "}
            {profile.hobbies}
          </p>
        )}


        <br />
        <br />

        <button
          onClick={handleSaveProfile}
        >
          Save Hobbies & Skills
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }


  // ==================================================
  // GOALS PAGE
  // ==================================================

  if (page === "goals") {
    return (
      <div>
        <h1>My Goals 🎯</h1>

        <p>
          Set and manage your hobby and skill goals.
        </p>

        <input
          type="text"
          placeholder="Enter your goal"
          value={goal}
          onChange={(e) =>
            setGoal(e.target.value)
          }
        />

        <br />
        <br />

        <button onClick={handleSaveGoal}>
          Add Goal
        </button>

        {goal && (
          <p>
            <strong>My Goal:</strong>{" "}
            {goal}
          </p>
        )}

        <br />

        <button
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }


  // ==================================================
  // PRACTICE PAGE
  // ==================================================

  if (page === "practice") {
    return (
      <div>
        <h1>Practice Sessions 📅</h1>

        <p>
          Record your hobby and skill practice
          sessions.
        </p>

        <input
          type="text"
          placeholder="Enter activity"
          value={activity}
          onChange={(e) =>
            setActivity(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Duration in minutes"
          value={duration}
          onChange={(e) =>
            setDuration(e.target.value)
          }
        />

        <br />
        <br />

        <button onClick={handleSaveSession}>
          Add Session
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }


  // ==================================================
  // PROGRESS PAGE
  // ==================================================

  if (page === "progress") {
    return (
      <div>
        <h1>My Progress 📊</h1>

        <p>
          Track your hobby and skill progress
          here.
        </p>

        <button onClick={handleLoadProgress}>
          Load Progress
        </button>

        <p>
          <strong>Goal:</strong>{" "}
          {goal || "No goal added yet"}
        </p>

        <p>
          <strong>Practice Activity:</strong>{" "}
          {activity ||
            "No practice session yet"}
        </p>

        <p>
          <strong>
            Practice Duration:
          </strong>{" "}
          {duration
            ? `${duration} minutes`
            : "No duration added"}
        </p>

        <br />

        <button
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }


  // ==================================================
  // COMMUNITY PAGE
  // ==================================================

  if (page === "community") {
    return (
      <div>
        <h1>🌍 Community Sharing</h1>

        <p>
          Share your hobbies, skills and
          learning journey with the community.
        </p>

        <textarea
          placeholder="Write something about your hobby or skill..."
          rows="4"
          value={postText}
          onChange={(e) =>
            setPostText(e.target.value)
          }
        />

        <br />
        <br />

        <button onClick={handleCreatePost}>
          Share Post
        </button>

        <h2>Community Posts</h2>

        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id}>

              <p>
                <strong>
                  {post.email}
                </strong>
              </p>

              <p>
                {post.text}
              </p>

              <p>
                ❤️ Likes:{" "}
                {post.likes || 0}
              </p>

              <button
                onClick={() =>
                  handleLikePost(post.id)
                }
                disabled={
                  likedPosts[post.id]
                }
              >
                {likedPosts[post.id]
                  ? "Liked ❤️"
                  : "Like ❤️"}
              </button>

              <br />
              <br />

              <input
                type="text"
                placeholder="Write a comment..."
                value={
                  commentText[post.id] || ""
                }
                onChange={(e) =>
                  setCommentText({
                    ...commentText,
                    [post.id]:
                      e.target.value,
                  })
                }
              />

              <button
                onClick={() =>
                  handleAddComment(post.id)
                }
              >
                Add Comment
              </button>


              {/* COMMENTS */}

              {comments[post.id] &&
                comments[post.id].length >
                  0 && (
                  <div>
                    <h4>
                      Comments
                    </h4>

                    {comments[
                      post.id
                    ].map((comment) => (
                      <p
                        key={
                          comment.id
                        }
                      >
                        <strong>
                          {comment.email}:
                        </strong>{" "}
                        {comment.text}
                      </p>
                    ))}
                  </div>
                )}

              <hr />
            </div>
          ))
        )}

        <br />

        <button
          onClick={() =>
            setPage("dashboard")
          }
        >
          Back to Dashboard
        </button>
      </div>
    );
  }


  // ==================================================
  // DASHBOARD
  // ==================================================

  if (page === "dashboard") {
    return (
      <div>
        <h1>
          🎯 Hobby & Skills Tracker
        </h1>

        <h2>
          Welcome to Dashboard 🎉
        </h2>

        <p>
          Manage your hobbies, skills,
          goals and practice progress here.
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {auth.currentUser?.email}
        </p>

        <button
          onClick={() =>
            setPage("profile")
          }
        >
          Profile
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            setPage("hobbies")
          }
        >
          My Hobbies & Skills
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            setPage("goals")
          }
        >
          My Goals
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            setPage("practice")
          }
        >
          Practice Sessions
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            setPage("progress")
          }
        >
          My Progress
        </button>

        <br />
        <br />

        <button
          onClick={() =>
            setPage("community")
          }
        >
          Community Sharing
        </button>

        <br />
        <br />

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }


  // ==================================================
  // LOGIN / REGISTER PAGE
  // ==================================================

  return (
    <div>
      <h1>
        Hobby & Skills Tracker
      </h1>

      <h2>
        {page === "login"
          ? "Login"
          : "Create Account"}
      </h2>

      <form onSubmit={handleSubmit}>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        <br />
        <br />

        <button type="submit">
          {page === "login"
            ? "Login"
            : "Register"}
        </button>

      </form>

      <br />

      <button
        onClick={() =>
          setPage(
            page === "login"
              ? "register"
              : "login"
          )
        }
      >
        {page === "login"
          ? "Create a new account"
          : "Already have an account? Login"}
      </button>
    </div>
  );
}


export default App;