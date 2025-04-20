import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
} from '@chakra-ui/react';

export default function Custom500() {
  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6} align="center">
        <Heading as="h1" size="xl">
          500 - サーバーエラー
        </Heading>
        <Text>
          申し訳ありません。サーバーで問題が発生しました。
        </Text>
        <Button
          colorScheme="blue"
          onClick={() => window.location.reload()}
        >
          ページを再読み込み
        </Button>
      </VStack>
    </Container>
  );
} 