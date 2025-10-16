import { ChakraProvider, Box } from '@chakra-ui/react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme.ts';
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Login from './pages/Login.tsx';
import Signup from './pages/Signup.tsx';
import Analysis from './pages/Analysis.tsx';
import Metrics from './pages/Metrics.tsx';
import PrivateRoute from './components/PrivateRoute.tsx';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Box minH="100vh" display="flex" flexDirection="column">
            <Navbar />
            <Box
              as="main"
              flex="1"
              display="flex"
              flexDirection="column"
              width="100%"
              maxW={{ base: "100%", md: "90%", lg: "1400px" }}
              mx="auto"
              px={{ base: 4, md: 6, lg: 8 }}
              py={{ base: 4, md: 6, lg: 8 }}
              gap={6}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                    <Route element={<PrivateRoute />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/analysis/:id?" element={<Analysis />} />
                      <Route path="/metrics" element={<Metrics />} />
                    </Route>
              </Routes>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  )
}

export default App
