import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6} align="center">
        <Heading as="h1" size="xl">
          404 - ページが見つかりません
        </Heading>
        <Text>
          お探しのページは存在しないか、移動した可能性があります。
        </Text>
        <Button
          colorScheme="blue"
          onClick={() => router.push('/')}
        >
          トップページに戻る
        </Button>
      </VStack>
    </Container>
  );
} 