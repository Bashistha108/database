
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Tables from './pages/Tables';
import CreateTable from './pages/CreateTable';
import TableDetails from './pages/TableDetails';
import Relationships from './pages/Relationships';
import BrowseData from './pages/BrowseData';
import Console from './pages/Console';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/tables" replace />} />
          <Route path="tables" element={<Tables />} />
          <Route path="tables/new" element={<CreateTable />} />
          <Route path="tables/:tableName" element={<TableDetails />} />
          <Route path="relationships" element={<Relationships />} />
          <Route path="browse" element={<BrowseData />} />
          <Route path="console" element={<Console />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
