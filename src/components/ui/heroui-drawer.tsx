/*
  HeroUI's Drawer, re-exported so the rest of the app imports one module.
  The stylesheet itself is imported once in src/styles.css: this app has a
  single CSS entry built by Vite, and importing "@heroui/styles/css" here would
  pull Tailwind in a second time for every page that uses the drawer.
*/
import { Drawer, useOverlayState } from "@heroui/react"

export { Drawer, useOverlayState }
export default Drawer
