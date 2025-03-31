# Klaviyo MCP Server

    A comprehensive Model Context Protocol (MCP) server for interacting with the Klaviyo API. This server provides tools and resources for managing profiles, lists, segments, campaigns, flows, and more in Klaviyo.

    ## Features

    - Complete coverage of Klaviyo API endpoints
    - MCP tools for all major Klaviyo operations
    - MCP resources for accessing Klaviyo data
    - Easy integration with LLMs via the Model Context Protocol

    ## Setup

    1. Clone this repository
    2. Install dependencies:
       ```
       npm install
       ```
    3. Create a `.env` file based on `.env.example` and add your Klaviyo API key:
       ```
       KLAVIYO_API_KEY=your_private_api_key_here
       ```
    4. Start the server:
       ```
       npm run dev
       ```

    ## Testing with MCP Inspector

    You can test the server using the MCP Inspector:

    ```
    npm run inspect
    ```

    This will open a web interface where you can test all the available tools and resources.

    ## Available Tools

    ### Profiles
    - `get_profiles`: Get profiles from Klaviyo
    - `get_profile`: Get a specific profile from Klaviyo
    - `create_profile`: Create a new profile in Klaviyo
    - `update_profile`: Update an existing profile in Klaviyo
    - `delete_profile`: Delete a profile from Klaviyo

    ### Lists
    - `get_lists`: Get lists from Klaviyo
    - `get_list`: Get a specific list from Klaviyo
    - `create_list`: Create a new list in Klaviyo
    - `add_profiles_to_list`: Add profiles to a list in Klaviyo

    ### Segments
    - `get_segments`: Get segments from Klaviyo
    - `get_segment`: Get a specific segment from Klaviyo

    ### Events
    - `get_events`: Get events from Klaviyo
    - `create_event`: Create a new event in Klaviyo

    ### Metrics
    - `get_metrics`: Get metrics from Klaviyo
    - `get_metric`: Get a specific metric from Klaviyo

    ### Campaigns
    - `get_campaigns`: Get campaigns from Klaviyo
    - `get_campaign`: Get a specific campaign from Klaviyo

    ### Flows
    - `get_flows`: Get flows from Klaviyo
    - `get_flow`: Get a specific flow from Klaviyo
    - `update_flow_status`: Update the status of a flow in Klaviyo

    ### Templates
    - `get_templates`: Get templates from Klaviyo
    - `get_template`: Get a specific template from Klaviyo
    - `create_template`: Create a new template in Klaviyo

    ### Catalogs
    - `get_catalogs`: Get catalogs from Klaviyo
    - `get_catalog_items`: Get items from a catalog in Klaviyo
    - `get_catalog_item`: Get a specific item from a catalog in Klaviyo

    ### Tags
    - `get_tags`: Get tags from Klaviyo
    - `create_tag`: Create a new tag in Klaviyo
    - `add_tag_to_resource`: Add a tag to a resource in Klaviyo

    ### Webhooks
    - `get_webhooks`: Get webhooks from Klaviyo
    - `create_webhook`: Create a new webhook in Klaviyo
    - `delete_webhook`: Delete a webhook from Klaviyo

    ### Data Privacy
    - `request_profile_deletion`: Request deletion of a profile for data privacy compliance

    ### Coupons
    - `get_coupons`: Get coupons from Klaviyo
    - `create_coupon_code`: Create a new coupon code in Klaviyo

    ### Forms
    - `get_forms`: Get forms from Klaviyo
    - `get_form`: Get a specific form from Klaviyo

    ### Reviews
    - `get_product_reviews`: Get product reviews from Klaviyo
    - `get_product_review`: Get a specific product review from Klaviyo

    ### Images
    - `get_images`: Get images from Klaviyo
    - `get_image`: Get a specific image from Klaviyo

    ## Available Resources

    - `klaviyo://profile/{id}`: Get information about a specific profile
    - `klaviyo://list/{id}`: Get information about a specific list
    - `klaviyo://segment/{id}`: Get information about a specific segment
    - `klaviyo://campaign/{id}`: Get information about a specific campaign
    - `klaviyo://flow/{id}`: Get information about a specific flow
    - `klaviyo://template/{id}`: Get information about a specific template
    - `klaviyo://metric/{id}`: Get information about a specific metric
    - `klaviyo://catalog/{id}`: Get information about a specific catalog

    ## API Documentation

    For more information about the Klaviyo API, see the [official documentation](https://developers.klaviyo.com/en/reference/api_overview).
