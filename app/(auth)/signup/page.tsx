'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeSwitcher from '@/components/auth/ThemeSwitcher'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Aqui podes adicionar a lógica de signup com Supabase ou outro backend
    alert('Signup submit (implementar lógica)')
  }

  return (
    <>
      <ThemeSwitcher />

      <main className="page-wrapper auth-scope">
        <div id="my_switcher" className="my_switcher">
          <ul>
            <li>
              <a href="#" data-theme="light" className="setColor light">
                <img src="/assets/images/light/switch/sun-01.svg" alt="Sun images" />
                <span title="Light Mode">Light</span>
              </a>
            </li>
            <li>
              <a href="#" data-theme="dark" className="setColor dark">
                <img src="/assets/images/light/switch/vector.svg" alt="Vector Images" />
                <span title="Dark Mode">Dark</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="signup-area">
          <div className="wrapper">
            <div className="row">
              <div className="col-lg-6 bg-color-blackest left-wrapper">
                <div className="sign-up-box">
                  <div className="signup-box-top">
                    <img className="logo-light" src="/assets/images/logo/logo.png" alt="sign-up logo" />
                    <img className="logo-dark" src="/assets/images/light/logo/logo-dark.png" alt="ChatBot Logo" />
                  </div>

                  <div className="signup-box-bottom">
                    <div className="signup-box-content">
                      <div className="social-btn-grp">
                        <button className="btn-default btn-border" type="button" disabled>
                          <span className="icon-left">
                            <img src="/assets/images/sign-up/google.png" alt="Google Icon" />
                          </span>
                          Login with Google
                        </button>

                        <button className="btn-default btn-border" type="button" disabled>
                          <span className="icon-left">
                            <img src="/assets/images/sign-up/facebook.png" alt="Facebook Icon" />
                          </span>
                          Login with Facebook
                        </button>
                      </div>

                      <div className="text-social-area">
                        <hr />
                        <span>Or continue with</span>
                        <hr />
                      </div>

                      <form onSubmit={handleSubmit}>
                        <div className="input-section">
                          <div className="icon">
                            <i className="feather-user" />
                          </div>
                          <input
                            type="text"
                            placeholder="Enter Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="input-section mail-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-envelope" />
                          </div>
                          <input
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <div className="input-section password-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-lock" />
                          </div>
                          <input
                            type="password"
                            placeholder="Create Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>

                        <div className="input-section password-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-lock" />
                          </div>
                          <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>

                        <div className="forget-text">
                          <Link className="btn-read-more" href="/forgot-password">
                            <span>Forgot password</span>
                          </Link>
                        </div>

                        <button type="submit" className="btn-default" disabled={loading}>
                          Sign Up
                        </button>

                        {error && (
                          <p style={{ color: 'crimson', marginTop: 10, fontSize: 14 }}>
                            {error}
                          </p>
                        )}
                      </form>
                    </div>

                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        Do you have an account?
                        <Link className="btn-read-more ml--5" href="/login">
                          <span>Sign In</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 right-wrapper">
                <div className="client-feedback-area">
                  <div className="single-feedback">
                    <div className="inner">
                      <div className="meta-img-section">
                        <a className="image" href="#">
                          <img src="/assets/images/team/team-02sm.jpg" alt="" />
                        </a>
                      </div>

                      <div className="rating">
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                      </div>

                      <div className="content">
                        <p className="description">
                          Rainbow-Themes is now a crucial component of our work! We made it simple to collaborate across
                          departments by grouping our work
                        </p>

                        <div className="bottom-content">
                          <div className="meta-info-section">
                            <h4 className="title-text mb--0">Guy Hawkins</h4>
                            <p className="desc mb--20">Nursing Assistant</p>
                            <div className="desc-img">
                              <img src="/assets/images/brand/brand-t.png" alt="Brand Image" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link className="close-button" href="/">
          <i className="fa-sharp fa-regular fa-x" />
        </Link>
      </main>
    </>
  )
}
