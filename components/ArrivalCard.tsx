import Link from "next/link";

interface Props {
  title: string;
  description: string;
  link: string;
}

export default function ArrivalCard({
  title,
  description,
  link,
}: Props) {
  return (
    <Link href={link}>
      <div className="border rounded-2xl p-6 shadow hover:shadow-lg transition cursor-pointer">
        <h2 className="text-2xl font-semibold mb-2">
          {title}
        </h2>

        <p>{description}</p>
      </div>
    </Link>
  );
}