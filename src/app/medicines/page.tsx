/** Inventory route; the interactive inventory UI lives in MedicinesClient. */

import MedicinesClient from "@/components/medicines/MedicinesClient";

export const dynamic = "force-dynamic";

export default async function MedicinesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  return <MedicinesClient initialFilter={filter ?? ""} />;
}
