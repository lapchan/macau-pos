import { getHomepageSections } from "@/lib/actions/homepage-actions";
import HomepageClient from "./homepage-client";

export const metadata = { title: "Homepage Builder" };

export default async function HomepageBuilderPage() {
  let sections: any[] = [];
  try {
    sections = await getHomepageSections();
  } catch (error) {
    console.error("Failed to load homepage sections:", error);
  }
  return <HomepageClient initialSections={sections} />;
}
