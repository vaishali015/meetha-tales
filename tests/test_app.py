import unittest
import os

class TestMeethaTales(unittest.TestCase):

    def test_index_page_exists(self):
        self.assertTrue(os.path.exists("public/index.html"))

    def test_meetha_tales_title(self):
        with open("public/index.html", "r", encoding="utf-8") as file:
            content = file.read()

        self.assertIn("Meetha Tales", content)

if __name__ == "__main__":
    unittest.main()