import { headers } from "next/headers";
import { Shop } from "./shop";

export default async function Home() {
  await headers();
  return <Shop />;
}
