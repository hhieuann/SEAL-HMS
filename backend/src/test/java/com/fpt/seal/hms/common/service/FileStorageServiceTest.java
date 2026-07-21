package com.fpt.seal.hms.common.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThat;

/** Stores uploads under ./uploads with a random name; created files are cleaned up. */
class FileStorageServiceTest {

    private final FileStorageService service = new FileStorageService();

    @Test
    void storeFile_returnsNull_forNullOrEmpty() {
        assertThat(service.storeFile(null)).isNull();
        assertThat(service.storeFile(new MockMultipartFile("f", "empty.png", "image/png", new byte[0]))).isNull();
    }

    @Test
    void storeFile_writesFile_andReturnsUploadsPathWithExtension() throws Exception {
        MultipartFile file = new MockMultipartFile("f", "proof.png", "image/png", "hello".getBytes());

        String url = service.storeFile(file);

        try {
            assertThat(url).startsWith("/uploads/").endsWith(".png");
            Path stored = Paths.get(url.replaceFirst("^/", ""));
            assertThat(Files.exists(stored)).isTrue();
            assertThat(Files.readString(stored)).isEqualTo("hello");
        } finally {
            // clean up the file this test created
            Files.deleteIfExists(Paths.get(url.replaceFirst("^/", "")));
        }
    }

    @Test
    void storeFile_handlesNoExtension() throws Exception {
        MultipartFile file = new MockMultipartFile("f", "noext", "text/plain", "data".getBytes());

        String url = service.storeFile(file);

        try {
            assertThat(url).startsWith("/uploads/");
        } finally {
            Files.deleteIfExists(Paths.get(url.replaceFirst("^/", "")));
        }
    }
}
