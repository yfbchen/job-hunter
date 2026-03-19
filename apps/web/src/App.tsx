import { useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Artifacts } from "./pages/Artifacts";
import { JobDetail } from "./pages/JobDetail";
import type { Page } from "./types";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const goToJob = (id: string) => {
    setSelectedJobId(id);
    setPage("job");
  };

  return (
    <Layout page={page} onNav={setPage}>
      {page === "dashboard" && <Dashboard onSelectJob={goToJob} />}
      {page === "artifacts" && <Artifacts />}
      {page === "job" && selectedJobId && (
        <JobDetail jobId={selectedJobId} onBack={() => setPage("dashboard")} />
      )}
    </Layout>
  );
}

export default App;
