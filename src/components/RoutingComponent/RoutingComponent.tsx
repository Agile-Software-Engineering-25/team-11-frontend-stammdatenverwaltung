import Home from '@pages/Home/Home';
import { Route, Routes } from 'react-router';
import Create_User from '@/pages/Create_User/Create_User';

const RoutingComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create_user" element={<Create_User />} />
    </Routes>
  );
};

export default RoutingComponent;
