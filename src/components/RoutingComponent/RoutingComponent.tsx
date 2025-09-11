import Home from '@pages/Home/Home';
import { Route, Routes } from 'react-router';
import Create_Person from '@/pages/Create_Person/Create_Person';

const RoutingComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create_person" element={<Create_Person />} />
    </Routes>
  );
};

export default RoutingComponent;
