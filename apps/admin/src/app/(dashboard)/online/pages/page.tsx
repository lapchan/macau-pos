import { getPages } from "@/lib/actions/storefront-actions";
import PagesClient from "./pages-client";

export const metadata = { title: "Pages" };

export default async function PagesPage() {
  let pages: any[] = [];
  try {
    pages = await getPages();
  } catch (error) {
    console.error("Failed to load pages:", error);
  }
  return <PagesClient initialPages={pages} />;
}
