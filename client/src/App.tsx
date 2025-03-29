import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import Dashboard from "@/pages/dashboard";
import ContentList from "@/pages/content-list";
import ContentDetail from "@/pages/content-detail";
import ContentCreate from "@/pages/content-create";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <Dashboard />}
      </Route>
      <Route path="/content/create">
        {() => <ContentCreate />}
      </Route>
      <Route path="/content/:type">
        {(params) => <ContentList type={params.type} />}
      </Route>
      <Route path="/content/detail/:id">
        {(params) => <ContentDetail id={params.id} />}
      </Route>
      <Route>
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar}>
        <Router />
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
