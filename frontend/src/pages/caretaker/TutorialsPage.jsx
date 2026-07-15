import { useAuth } from '../../context/AuthContext';

export default function TutorialsPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Caretaker Tutorials</h1>
      <p>Kia ora {user?.name}, guides on caring for the marae.</p>
      {/* TODO: tutorial list/content */}
    </div>
  );
}