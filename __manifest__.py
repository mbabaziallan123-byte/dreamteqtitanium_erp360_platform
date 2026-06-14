# -*- coding: utf-8 -*-
##############################################################################
# DreamTeQ 360 — Odoo 18 Module Manifest
# Module: dreamteq_farmer_tracking
#
# Tracks farmer field activities, soil readings, crop recommendations,
# IoT sensor telemetry, and monetization analytics within Odoo 18.
#
# Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
# Tel: +254718554383 | Web: www.dreamteamconsult.site
# Email: dreamteamconsult@gmx.com
# Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
##############################################################################

{
    'name':        'DreamTeQ 360 Farmer Tracking',
    'version':     '18.0.1.0.0',
    'category':    'Agriculture / ERP',
    'summary':     'AI-driven farmer field tracking, soil analytics, and monetization telemetry for DreamTeQ 360.',
    'description': """
DreamTeQ 360 Farmer Tracking Module
=====================================
Integrates Odoo 18 with the DreamTeQ 360 platform for:
- Farmer profile and field management
- Soil health IoT sensor readings
- Crop recommendation AI pipeline
- Monetization telemetry (SMM, LLMM, SEO, LLEO)
- WebSocket broadcast integration via Redis
- Supabase sync for offline-first PouchDB data reconciliation
- AMANDA AI agent activity logs

Product of Dreamteam Consulting Company, Nairobi, Kenya.
    """,
    'author':       'Dreamteam Consulting Company',
    'website':      'https://www.dreamteamconsult.site',
    'license':      'LGPL-3',
    'maintainer':   'Dreamteam Consulting Company',

    'depends': [
        'base',
        'mail',
        'web',
        'contacts',
        'product',
        'stock',
        'account',
        'sale_management',
        'purchase',
        'project',
    ],

    'data': [
        # Security
        'security/dreamteq_security.xml',
        'security/ir.model.access.csv',
        # Data
        'data/dreamteq_default_data.xml',
        # Views
        'views/farmer_profile_views.xml',
        'views/field_activity_views.xml',
        'views/soil_reading_views.xml',
        'views/crop_recommendation_views.xml',
        'views/telemetry_event_views.xml',
        'views/monetization_counter_views.xml',
        'views/dreamteq_menus.xml',
        # Reports
        'report/farmer_activity_report.xml',
    ],

    'assets': {
        'web.assets_backend': [
            'dreamteq_farmer_tracking/static/src/js/dreamteq_dashboard.js',
            'dreamteq_farmer_tracking/static/src/css/dreamteq_theme.css',
        ],
    },

    'demo': [
        'demo/dreamteq_demo_data.xml',
    ],

    'images': [
        'static/description/icon.png',
        'static/description/banner.png',
    ],

    'installable':    True,
    'auto_install':   False,
    'application':    True,
    'sequence':       10,

    # DreamTeQ extension metadata
    'dreamteq_meta': {
        'platform_version': '360-v3.6',
        'redis_channels': [
            'dreamteq:broadcast',
            'dreamteq:odoo',
            'dreamteq:frappe',
            'dreamteq:metrics',
        ],
        'monetization_channels': ['SMM', 'LLMM', 'LLEO', 'SEO'],
        'pouchdb_sync_enabled':  True,
        'amanda_agent_enabled':  True,
        'supabase_tables': [
            'telemetry_events',
            'miniapp_usage',
            'lms_progress',
            'monetization_counters',
            'farmer_profiles',
            'soil_readings',
            'crop_recommendations',
        ],
    },
}

##############################################################################
# Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
# Tel: +254718554383 | Web: www.dreamteamconsult.site
# Email: dreamteamconsult@gmx.com
# Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
##############################################################################
