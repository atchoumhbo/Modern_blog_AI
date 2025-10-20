import { Outlet } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 pt-16 pb-16 sm:pb-0">
        <Outlet />
      </main>
      <MobileNav />
      <Footer />
    </div>
  )
}