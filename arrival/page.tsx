import ArrivalCard from "../components/ArrivalCard";

export default function ArrivalPage() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-6">
        Arrival Information
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <ArrivalCard
          title="Gas Instructions"
          description="Learn how to turn on the gas safely."
          link="/arrival/gas"
        />

        <ArrivalCard
          title="WiFi Information"
          description="Connect to the marae WiFi."
          link="/arrival/wifi"
        />

        <ArrivalCard
          title="Contacts"
          description="Find who to contact for help."
          link="/arrival/contacts"
        />

        <ArrivalCard
          title="Rules & Regulations"
          description="Understand marae expectations."
          link="/arrival/rules"
        />
      </div>
    </main>
  );
}