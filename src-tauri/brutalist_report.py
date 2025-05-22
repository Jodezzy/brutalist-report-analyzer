import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import argparse
import os
import sys
import time

class BrutalistReportScraper:
    """
    Enhanced scraper for brutalist.report with support for:
    - Today or last week scraping
    - Topic filtering
    - Progress tracking
    - Grouped results by similarity
    - Sorting by group size
    """

    AVAILABLE_TOPICS = [
        "tech",
        "news",
        "business",
        "science",
        "gaming",
        "culture",
        "politics",
        "sports",
    ]

    def __init__(self):
        self.base_url = "https://brutalist.report"
        self.progress_bar = None
        # Adjusted similarity thresholds to be more balanced between topic and general
        self.similarity_thresholds = {
            "topic": 4,  # Topic-specific content needs 4 common words
            "general": 4,  # General content also needs 4 common words
            "topic_last_week": 5,  # Topic content from last week needs 5 common words
            "general_last_week": 6,  # General content from last week needs 6 common words
        }
        # Minimum number of articles required to form a group
        self.min_group_size = 5

    def create_url(self, topic=None, before_date=None):
        """Constructs URL based on topic and date parameters"""
        url = self.base_url

        # Add topic path if provided
        if topic and topic in self.AVAILABLE_TOPICS:
            url += f"/topic/{topic}"

        # Add before parameter if provided
        if before_date:
            url += f"?before={before_date}"

        return url

    def scrape_page(self, url):
        """Scrapes a single brutalist.report page"""
        self.update_progress("Fetching URL: " + url)
        try:
            response = requests.get(url)
            response.raise_for_status()
        except requests.RequestException as e:
            self.update_progress(f"Error fetching {url}: {e}")
            return None

        # Parse the HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Find the brutal-grid div that contains news sections
        brutal_grid = soup.find("div", class_="brutal-grid")
        if not brutal_grid:
            self.update_progress(f"No news grid found on {url}")
            return None

        # Dictionary to store results
        news_data = {"url": url, "sources": {}}

        # Process each news source div within the grid
        for div in brutal_grid.find_all("div", recursive=False):
            # Get the source name from the h3 tag
            h3 = div.find("h3")
            if not h3 or not h3.find("a"):
                continue

            source_name = h3.find("a").text.strip()

            # Get all headlines in this source's list
            headlines = []
            ul = div.find("ul")
            if not ul:
                continue

            for li in ul.find_all("li"):
                # Get the main headline link
                headline_link = li.find("a")
                if not headline_link:
                    continue

                headline_url = headline_link.get("href", "")
                headline_text = headline_link.text.strip()

                # Get time if available (in the format [1h])
                time_text = None
                for text in li.stripped_strings:
                    if "[" in text and "]" in text and "h]" in text:
                        time_text = text.strip()
                        break

                # Get the source-specific link (like [hn])
                source_specific_link = None
                links = li.find_all("a")
                if len(links) > 1:
                    last_link = links[-1]
                    if last_link.text.strip().startswith("[") and last_link.text.strip().endswith("]"):
                        source_specific_link = {
                            "text": last_link.text.strip(),
                            "url": last_link.get("href", ""),
                        }

                headlines.append({
                    "title": headline_text,
                    "url": headline_url,
                    "time": time_text,
                    "source_link": source_specific_link,
                })

            # Add this source to our news data
            if headlines:
                news_data["sources"][source_name] = headlines

        return news_data

    def scrape_today(self, topic=None):
        """Scrapes today's headlines, optionally filtered by topic"""
        url = self.create_url(topic)
        self.update_progress(json.dumps({
            "status": "progress",
            "message": f"Scraping today's content{f' for {topic}' if topic else ''}...",
            "processed": 0,
            "total": 0
        }))
        return self.scrape_page(url)

    def scrape_last_week(self, topic=None):
        """Scrapes headlines from the past week, optionally filtered by topic"""
        # Generate dates for the past week
        current_date = datetime.now().date()
        dates = []
        for i in range(2, 9):  # 2 to 8 inclusive (7 days)
            date = current_date - timedelta(days=i)
            dates.append(date.strftime("%Y-%m-%d"))

        # Scrape data for each date
        aggregated_data = {
            "date_range": f"{dates[-1]} to {dates[0]}",  # Oldest to newest
            "sources": {},
        }

        self.update_progress(json.dumps({
            "status": "progress",
            "message": f"Scraping past week ({aggregated_data['date_range']}){f' for {topic}' if topic else ''}...",
            "processed": 0,
            "total": len(dates)
        }))

        for i, before_date in enumerate(dates, 1):
            url = self.create_url(topic, before_date)
            news_data = self.scrape_page(url)

            if news_data and news_data.get("sources"):
                for source, headlines in news_data["sources"].items():
                    if source not in aggregated_data["sources"]:
                        aggregated_data["sources"][source] = []
                    aggregated_data["sources"][source].extend(headlines)

            # Update progress
            self.update_progress(json.dumps({
                "status": "progress",
                "message": f"Processing date {before_date}...",
                "processed": i,
                "total": len(dates)
            }))

        return aggregated_data

    def find_common_headlines(self, news_data, is_topic=False, is_last_week=False):
        """Identifies headlines common across different sources"""
        if not news_data or "sources" not in news_data:
            return []

        # Set similarity threshold based on context
        if is_topic and is_last_week:
            similarity_threshold_count = self.similarity_thresholds["topic_last_week"]
        elif is_topic:
            similarity_threshold_count = self.similarity_thresholds["topic"]
        elif is_last_week:
            similarity_threshold_count = self.similarity_thresholds["general_last_week"]
        else:
            similarity_threshold_count = self.similarity_thresholds["general"]

        # Flatten all headlines
        all_headlines = []
        for source, headlines in news_data["sources"].items():
            for headline in headlines:
                all_headlines.append({
                    "source": source,
                    "title": headline["title"],
                    "url": headline["url"],
                    "time": headline.get("time"),
                    "source_link": headline.get("source_link"),
                })

        total_headlines = len(all_headlines)
        self.update_progress(json.dumps({
            "status": "progress",
            "message": "Starting headline analysis...",
            "processed": 0,
            "total": total_headlines
        }))

        common_topics = []
        processed_headlines = set()

        # Compare headlines
        for i, headline1 in enumerate(all_headlines, 1):
            if headline1["title"] in processed_headlines:
                self.update_progress(json.dumps({
                    "status": "progress",
                    "message": "Analyzing headlines...",
                    "processed": i,
                    "total": total_headlines
                }))
                continue

            similar_headlines = []

            for headline2 in all_headlines:
                if headline1["title"] == headline2["title"]:
                    continue

                if headline2["title"] in processed_headlines:
                    continue

                # Similarity check
                words1 = set(headline1["title"].lower().split())
                words2 = set(headline2["title"].lower().split())
                common_words = words1.intersection(words2)

                if len(common_words) >= similarity_threshold_count:
                    if not similar_headlines:
                        similar_headlines.append({
                            "source": headline1["source"],
                            "title": headline1["title"],
                            "url": headline1["url"],
                            "time": headline1.get("time"),
                            "source_link": headline1.get("source_link"),
                        })

                    similar_headlines.append({
                        "source": headline2["source"],
                        "title": headline2["title"],
                        "url": headline2["url"],
                        "time": headline2.get("time"),
                        "source_link": headline2.get("source_link"),
                    })

            # Process similar headlines
            if similar_headlines and len(similar_headlines) >= self.min_group_size:
                sources = {h["source"] for h in similar_headlines}
                if len(sources) >= 2:
                    topic_name = self.generate_topic_name(similar_headlines)
                    common_topics.append({
                        "id": len(common_topics) + 1,
                        "topic_name": topic_name,
                        "count": len(similar_headlines),
                        "sources_count": len(sources),
                        "headlines": similar_headlines,
                    })

                    for headline in similar_headlines:
                        processed_headlines.add(headline["title"])

            self.update_progress(json.dumps({
                "status": "progress",
                "message": "Analyzing headlines...",
                "processed": i,
                "total": total_headlines
            }))

        # Sort by size
        common_topics.sort(key=lambda x: x["count"], reverse=True)
        
        # Re-assign IDs
        for i, topic in enumerate(common_topics, 1):
            topic["id"] = i

        return common_topics

    def generate_topic_name(self, headlines):
        """Generates a descriptive name for a group of related headlines"""
        stop_words = {
            "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at",
            "to", "from", "by", "with", "in", "of", "is", "are", "was", "were",
            "be", "been", "being", "have", "has", "had", "do", "does", "did",
            "can", "could", "will", "would", "shall", "should", "may", "might",
            "must", "that", "which", "who", "whom", "this", "these", "those",
            "how", "why", "when", "where", "what", "hn", "nyt", "know", "best",
            "than", "just"
        }

        all_words = []
        for headline in headlines:
            words = headline["title"].lower().split()
            words = [
                word.strip(".,;:!?()-\"'")
                for word in words
                if word.lower() not in stop_words and len(word) > 2
            ]
            all_words.extend(words)

        word_counts = {}
        for word in all_words:
            word_counts[word] = word_counts.get(word, 0) + 1

        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        top_words = [word for word, count in sorted_words[:5] if count >= 2]

        if not top_words:
            first_headline = headlines[0]["title"]
            return first_headline[:50] + ("..." if len(first_headline) > 50 else "")

        return " ".join(top_words[:3]).title()

    def update_progress(self, message):
        """Updates progress information"""
        print(message, flush=True)

    def run(self, topic=None, last_week=False):
        """Main entry point to run the scraper"""
        if topic and topic not in self.AVAILABLE_TOPICS:
            print(json.dumps({
                "status": "error",
                "message": f"Invalid topic. Available topics: {', '.join(self.AVAILABLE_TOPICS)}"
            }))
            return

        try:
            # Scrape data
            if last_week:
                news_data = self.scrape_last_week(topic)
            else:
                news_data = self.scrape_today(topic)

            if not news_data or not news_data.get("sources"):
                print(json.dumps({
                    "status": "error",
                    "message": "No data found. Please check your internet connection and try again."
                }))
                return

            # Store topic information
            if topic:
                news_data["topic"] = topic

            # Find common headlines
            common_topics = self.find_common_headlines(
                news_data,
                is_topic=bool(topic),
                is_last_week=last_week
            )

            # Prepare result
            result = {
                "date": news_data.get("date_range", datetime.now().strftime("%Y-%m-%d")),
                "topic": news_data.get("topic", "all"),
                "is_last_week": last_week,
                "common_topics": common_topics,
                "total_groups": len(common_topics),
                "total_headlines": sum(
                    group.get("count", len(group["headlines"]))
                    for group in common_topics
                )
            }

            # Output final result as JSON
            print(json.dumps(result))

        except Exception as e:
            print(json.dumps({
                "status": "error",
                "message": str(e)
            }))

def main():
    """Command-line interface for the Brutalist Report Scraper"""
    parser = argparse.ArgumentParser(description="Enhanced Brutalist Report Scraper")
    parser.add_argument(
        "--topic",
        choices=BrutalistReportScraper.AVAILABLE_TOPICS,
        help="Filter by topic (tech, news, business, science, gaming, culture, politics, sports)",
    )
    parser.add_argument(
        "--last-week",
        action="store_true",
        help="Scrape last week's headlines instead of today's",
    )

    args = parser.parse_args()

    try:
        scraper = BrutalistReportScraper()
        scraper.run(topic=args.topic, last_week=args.last_week)
    except KeyboardInterrupt:
        print(json.dumps({
            "status": "error",
            "message": "Operation cancelled by user."
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()