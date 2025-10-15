import { Flex, Button, useColorMode, Box, IconButton, useDisclosure, Container, Heading, HStack, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, Avatar, Text } from '@chakra-ui/react';
import { MoonIcon, SunIcon, HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  return (
    <Box borderBottom="1px" borderColor={borderColor} bg={bg} position="sticky" top={0} zIndex={10}>
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <HStack spacing={8} alignItems="center">
            <Heading as={RouterLink} to="/" size="md" color="brand.500">
              AquaSense
            </Heading>
            <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
              <Button as={RouterLink} to="/" variant="ghost">
                Home
              </Button>
              {currentUser && (
                <>
                  <Button as={RouterLink} to="/dashboard" variant="ghost">
                    Dashboard
                  </Button>
                  <Button as={RouterLink} to="/species" variant="ghost">
                    Species
                  </Button>
                  <Button as={RouterLink} to="/analysis" variant="ghost">
                    Analysis
                  </Button>
                </>
              )}
            </HStack>
          </HStack>

          <HStack spacing={4}>
            <IconButton
              size="md"
              fontSize="lg"
              variant="ghost"
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
            />
            
            {currentUser ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded="full"
                  variant="link"
                  cursor="pointer"
                  minW={0}
                >
                  <Avatar
                    size="sm"
                    name={currentUser.displayName || currentUser.email || ''}
                    src={currentUser.photoURL || ''}
                  />
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => navigate('/dashboard')}>Dashboard</MenuItem>
                  <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <>
                <Button as={RouterLink} to="/login" variant="outline" display={{ base: 'none', md: 'inline-flex' }}>
                  Sign In
                </Button>
                <Button as={RouterLink} to="/signup" colorScheme="brand" display={{ base: 'none', md: 'inline-flex' }}>
                  Sign Up
                </Button>
              </>
            )}

            <IconButton
              display={{ base: 'flex', md: 'none' }}
              onClick={isOpen ? onClose : onOpen}
              icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
              variant="ghost"
              aria-label="Toggle Navigation"
            />
          </HStack>
        </Flex>

        {/* Mobile menu */}
        {isOpen && (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as="nav" spacing={1}>
              <Button as={RouterLink} to="/" variant="ghost" justifyContent="start" w="full">
                Home
              </Button>
              {currentUser ? (
                <>
                  <Button as={RouterLink} to="/dashboard" variant="ghost" justifyContent="start" w="full">
                    Dashboard
                  </Button>
                  <Button as={RouterLink} to="/species" variant="ghost" justifyContent="start" w="full">
                    Species
                  </Button>
                  <Button as={RouterLink} to="/analysis" variant="ghost" justifyContent="start" w="full">
                    Analysis
                  </Button>
                  <Button variant="ghost" justifyContent="start" w="full" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button as={RouterLink} to="/login" variant="ghost" justifyContent="start" w="full">
                    Sign In
                  </Button>
                  <Button as={RouterLink} to="/signup" colorScheme="brand" w="full" justifyContent="start">
                    Sign Up
                  </Button>
                </>
              )}
            </Stack>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Navbar;
