#!/usr/bin/env python
# gofundme_scraper.py

import sys
import json
import pandas as pd
import requests
from bs4 import BeautifulSoup
from apify_client import ApifyClient
from transformers import pipeline

def clean_text(text):
    """Remove extra whitespace and newlines."""
    if text:
        return " ".join(text.split())
    return text

def scrape_gofundme_page(url):
    """ Scrape the GoFundMe campaign page for title & description using meta tags. """
    try:
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return None, None

        soup = BeautifulSoup(response.content, 'html.parser')
        name_meta = soup.find('meta', property='og:title')
        name = name_meta['content'] if (name_meta and name_meta.get('content')) else None
        
        description_meta = soup.find('meta', property='og:description')
        description = description_meta['content'] if (description_meta and description_meta.get('content')) else None

        return name, description
    except Exception as e:
        return None, None

if __name__ == "__main__":
    # 1. Parse the query from command line
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided"}))
        sys.exit(1)

    query = sys.argv[1]

    # 2. Initialize Apify Client with your token
    # NOTE: Replace "YOUR_APIFY_TOKEN" with your real token
    client = ApifyClient("apify_api_J3jja4Zuyicd2CCnXOI8RBSwDgaKgX1VFGWe")

    # 3. Define a limit for how many campaigns to fetch
    limit = 3

    # 4. Run the Apify actor for the single query
    run_input = {
        "query": query,
        "limit": limit
    }
    run = client.actor("RDZ33qDF65SRiTnxx").call(run_input=run_input)
    dataset_id = run["defaultDatasetId"]

    items = []
    for item in client.dataset(dataset_id).iterate_items():
        item["query"] = query
        items.append(item)

    df = pd.DataFrame(items)

    required_columns = ["amount_to_goal", "balance", "url", "query"]
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        selected_df = df.copy()
    else:
        selected_df = df[required_columns].rename(columns={
            "amount_to_goal": "Goal Amount",
            "balance": "Balance",
            "url": "URL",
            "query": "Query"
        })

    # 5. Summarize each campaign description (optional)
    try:
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    except Exception as e:
        # If pipeline creation fails, skip summarization
        summarizer = None

    names = []
    summarized_descriptions = []

    for _, row in selected_df.iterrows():
        url = row["URL"]
        name, desc = scrape_gofundme_page(url)
        cleaned_desc = clean_text(desc)

        if cleaned_desc and summarizer:
            try:
                summary_out = summarizer(cleaned_desc, max_length=120, min_length=30, do_sample=False)
                summary_text = summary_out[0]["summary_text"]
            except:
                summary_text = cleaned_desc
        else:
            summary_text = cleaned_desc

        names.append(name)
        summarized_descriptions.append(summary_text)

    selected_df["Name"] = names
    selected_df["Summarized Description"] = summarized_descriptions

    # 6. Print final results as JSON
    result = selected_df.to_dict(orient="records")
    print(json.dumps(result, ensure_ascii=False))
