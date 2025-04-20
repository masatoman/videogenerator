import { NextPageContext } from 'next';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
} from '@chakra-ui/react';

interface Props {
  statusCode?: number;
}

function Error({ statusCode }: Props) {
  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6} align="center">
        <Heading as="h1" size="xl">
          {statusCode
            ? `エラーが発生しました (${statusCode})`
            : 'エラーが発生しました'}
        </Heading>
        <Text>
          {statusCode
            ? `サーバーでエラーが発生しました (${statusCode})`
            : 'クライアントでエラーが発生しました'}
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

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 