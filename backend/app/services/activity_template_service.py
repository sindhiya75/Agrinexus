import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.activity_template import ActivityTemplate

logger = logging.getLogger(__name__)

CURATED_TEMPLATES = [
    # ---------------- Rice / Paddy ----------------
    {
        "name": "Paddy Field Deep Ploughing & Puddling",
        "category": "land_preparation",
        "crop_name": "Rice",
        "growth_stage": "Land Preparation",
        "days_after_sowing": -7,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Till soil to a fine tilth and puddle field with 5-10 cm standing water to prepare for transplanting.",
    },
    {
        "name": "Paddy Seedling Transplantation",
        "category": "sowing",
        "crop_name": "Rice",
        "growth_stage": "Transplanting",
        "days_after_sowing": 0,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Transplant 20-25 day old seedlings at 2-3 seedlings per hill with 20x15 cm spacing.",
    },
    {
        "name": "Basal Fertilizer Application (DAP + MOP)",
        "category": "fertilizer",
        "crop_name": "Rice",
        "growth_stage": "Early Vegetative",
        "days_after_sowing": 7,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Apply full dose of Phosphorus (DAP) and Potassium (MOP) plus 25% Nitrogen base dress.",
    },
    {
        "name": "First Hand Weeding & Tillering Water Check",
        "category": "scouting",
        "crop_name": "Rice",
        "growth_stage": "Active Tillering",
        "days_after_sowing": 21,
        "default_priority": "medium",
        "is_weather_sensitive": False,
        "description": "Inspect field for weed emergence and ensure 3-5 cm shallow standing water during maximum tillering.",
    },
    {
        "name": "First Top Dressing with Urea",
        "category": "fertilizer",
        "crop_name": "Rice",
        "growth_stage": "Active Tillering",
        "days_after_sowing": 35,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Broadcast 50 kg Urea/ha. Ensure field is not drained immediately to avoid volatilization.",
    },
    {
        "name": "Scout for Stem Borer & Leaf Folder",
        "category": "crop_protection",
        "crop_name": "Rice",
        "growth_stage": "Panicle Initiation",
        "days_after_sowing": 50,
        "default_priority": "high",
        "is_weather_sensitive": False,
        "description": "Inspect central shoots for dead hearts and folded leaves; check economic threshold level (ETL).",
    },
    {
        "name": "Panicle Top-Dress Urea & MOP",
        "category": "fertilizer",
        "crop_name": "Rice",
        "growth_stage": "Booting / Flowering",
        "days_after_sowing": 70,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Apply secondary top dress to support spikelet fertility and grain filling.",
    },
    {
        "name": "Pre-Harvest Field Drainage",
        "category": "irrigation",
        "crop_name": "Rice",
        "growth_stage": "Grain Maturity",
        "days_after_sowing": 105,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Drain standing water from the field 10-14 days before harvest to facilitate uniform ripening.",
    },
    {
        "name": "Paddy Grain Harvest & Threshing",
        "category": "harvest",
        "crop_name": "Rice",
        "growth_stage": "Harvest",
        "days_after_sowing": 120,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Harvest when 85% of panicles turn golden yellow and grain moisture is around 20-22%.",
    },

    # ---------------- Wheat ----------------
    {
        "name": "Wheat Seedbed Preparation & Pre-Sowing Irrigation",
        "category": "land_preparation",
        "crop_name": "Wheat",
        "growth_stage": "Land Preparation",
        "days_after_sowing": -7,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Pre-sowing irrigation (Paleva) followed by two cross-harrowings to create a pulverized seedbed.",
    },
    {
        "name": "Wheat Sowing with Seed Drill",
        "category": "sowing",
        "crop_name": "Wheat",
        "growth_stage": "Sowing",
        "days_after_sowing": 0,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Sow certified treated seed at 100-120 kg/ha with 20 cm row spacing and 4-5 cm depth.",
    },
    {
        "name": "Crown Root Initiation (CRI) Critical Irrigation",
        "category": "irrigation",
        "crop_name": "Wheat",
        "growth_stage": "Crown Root Initiation",
        "days_after_sowing": 21,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Most critical irrigation for wheat. Delay causes severe root growth retardation and yield loss.",
    },
    {
        "name": "First Nitrogen Top-Dressing",
        "category": "fertilizer",
        "crop_name": "Wheat",
        "growth_stage": "Tillering",
        "days_after_sowing": 40,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Apply Urea (60 kg/ha) right after first hoeing or second irrigation.",
    },
    {
        "name": "Scout for Yellow / Brown Rust",
        "category": "crop_protection",
        "crop_name": "Wheat",
        "growth_stage": "Jointing / Heading",
        "days_after_sowing": 65,
        "default_priority": "high",
        "is_weather_sensitive": False,
        "description": "Inspect leaf blades for linear yellow/orange pustule stripes under cool humid weather.",
    },
    {
        "name": "Milking Stage Supplemental Irrigation",
        "category": "irrigation",
        "crop_name": "Wheat",
        "growth_stage": "Milk Stage",
        "days_after_sowing": 85,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Irrigate to avoid terminal heat stress and shrivelled grain filling.",
    },
    {
        "name": "Wheat Crop Harvest & Bundling",
        "category": "harvest",
        "crop_name": "Wheat",
        "growth_stage": "Maturity",
        "days_after_sowing": 120,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Harvest when straw turns golden and brittle with grain moisture under 14%.",
    },

    # ---------------- Maize / Corn ----------------
    {
        "name": "Maize Ridge & Furrow Bed Preparation",
        "category": "land_preparation",
        "crop_name": "Maize",
        "growth_stage": "Land Preparation",
        "days_after_sowing": -5,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Form ridges at 60 cm distance to optimize drainage and root aeriation.",
    },
    {
        "name": "Maize Dibbling & Sowing",
        "category": "sowing",
        "crop_name": "Maize",
        "growth_stage": "Sowing",
        "days_after_sowing": 0,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Dibble one seed per hill at 20 cm intra-row spacing at 4 cm depth.",
    },
    {
        "name": "Fall Armyworm (FAW) Whorl Inspection",
        "category": "crop_protection",
        "crop_name": "Maize",
        "growth_stage": "Vegetative V4-V6",
        "days_after_sowing": 20,
        "default_priority": "high",
        "is_weather_sensitive": False,
        "description": "Check central whorl for shot-hole damage, pin holes, and frass deposits.",
    },
    {
        "name": "Knee-High Stage Nitrogen Top-Dressing",
        "category": "fertilizer",
        "crop_name": "Maize",
        "growth_stage": "Knee-High (V8)",
        "days_after_sowing": 35,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Side-dress Urea (50 kg/ha) along rows followed by light earthing-up.",
    },
    {
        "name": "Tasseling & Silking Stage Irrigation",
        "category": "irrigation",
        "crop_name": "Maize",
        "growth_stage": "Tasseling / Flowering",
        "days_after_sowing": 55,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Water deficit during pollination causes poor kernel set; maintain optimal soil moisture.",
    },
    {
        "name": "Corn Cob Harvest",
        "category": "harvest",
        "crop_name": "Maize",
        "growth_stage": "Harvest",
        "days_after_sowing": 100,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Harvest cobs when outer husks turn brown and dry, and black layer appears at kernel tip.",
    },

    # ---------------- Tomato & Horticultural Crops ----------------
    {
        "name": "Raised Nursery Bed Solarization & Sowing",
        "category": "land_preparation",
        "crop_name": "Tomato",
        "growth_stage": "Nursery",
        "days_after_sowing": -25,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Prepare raised nursery bed treated with Trichoderma viride to prevent damping-off.",
    },
    {
        "name": "Tomato Seedling Transplanting to Main Field",
        "category": "sowing",
        "crop_name": "Tomato",
        "growth_stage": "Transplanting",
        "days_after_sowing": 0,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Transplant 25-day old healthy seedlings on raised beds with drip lateral lines.",
    },
    {
        "name": "Tomato Staking & Trellising",
        "category": "maintenance",
        "crop_name": "Tomato",
        "growth_stage": "Vegetative Growth",
        "days_after_sowing": 20,
        "default_priority": "medium",
        "is_weather_sensitive": False,
        "description": "Erect bamboo stakes and twine to support indeterminate vines off damp soil.",
    },
    {
        "name": "Early Blight & Whitefly Monitoring",
        "category": "crop_protection",
        "crop_name": "Tomato",
        "growth_stage": "Flowering & Fruit Set",
        "days_after_sowing": 35,
        "default_priority": "high",
        "is_weather_sensitive": False,
        "description": "Inspect lower leaves for concentric brown target rings and check underside for whiteflies.",
    },
    {
        "name": "Calcium & Potassium Fertigation Boost",
        "category": "fertilizer",
        "crop_name": "Tomato",
        "growth_stage": "Fruit Development",
        "days_after_sowing": 50,
        "default_priority": "medium",
        "is_weather_sensitive": False,
        "description": "Apply soluble Potassium Nitrate and Calcium Nitrate via drip to prevent blossom end rot.",
    },
    {
        "name": "Ripe Fruit Picking (First Harvest)",
        "category": "harvest",
        "crop_name": "Tomato",
        "growth_stage": "Harvest",
        "days_after_sowing": 70,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Harvest fruits at breaker or pink stage for distant markets; red-ripe for local consumption.",
    },

    # ---------------- General Agronomic Fallback ----------------
    {
        "name": "Deep Summer Ploughing & Soil Solarization",
        "category": "land_preparation",
        "crop_name": "General",
        "growth_stage": "Pre-Planting",
        "days_after_sowing": -10,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Invert soil with mouldboard plough to expose dormant soil-borne pathogens and weed seeds to sun.",
    },
    {
        "name": "Field Sowing / Seed Bed Placement",
        "category": "sowing",
        "crop_name": "General",
        "growth_stage": "Sowing",
        "days_after_sowing": 0,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Sow treated seed at prescribed spacing and soil depth with adequate initial moisture.",
    },
    {
        "name": "First Irrigation & Seedling Establishment",
        "category": "irrigation",
        "crop_name": "General",
        "growth_stage": "Establishment",
        "days_after_sowing": 3,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Provide light irrigation to facilitate uniform germination and prevent soil crusting.",
    },
    {
        "name": "Vegetative Nutrients Top-Dress (Urea / NPK)",
        "category": "fertilizer",
        "crop_name": "General",
        "growth_stage": "Vegetative",
        "days_after_sowing": 25,
        "default_priority": "medium",
        "is_weather_sensitive": True,
        "description": "Supply supplemental nitrogen to accelerate leaf area index and canopy cover.",
    },
    {
        "name": "Pest & Foliar Disease Scouting",
        "category": "crop_protection",
        "crop_name": "General",
        "growth_stage": "Mid-Vegetative",
        "days_after_sowing": 40,
        "default_priority": "high",
        "is_weather_sensitive": False,
        "description": "Walk in 'W' pattern across field checking 20 representative plants for foliar symptoms.",
    },
    {
        "name": "Crop Maturity Inspection & Harvest",
        "category": "harvest",
        "crop_name": "General",
        "growth_stage": "Maturity",
        "days_after_sowing": 90,
        "default_priority": "high",
        "is_weather_sensitive": True,
        "description": "Check moisture and grain/fruit hardness before initiating harvest operations.",
    },
]


class ActivityTemplateService:
    """Service to retrieve, filter, and seed agricultural activity templates."""

    @staticmethod
    def ensure_templates_seeded(db: Session) -> None:
        """Seed default activity templates if the table is currently empty."""
        try:
            count = db.query(ActivityTemplate).count()
            if count == 0:
                logger.info("Seeding initial agricultural activity templates...")
                for item in CURATED_TEMPLATES:
                    tmpl = ActivityTemplate(
                        name=item["name"],
                        category=item["category"],
                        description=item["description"],
                        crop_name=item["crop_name"],
                        growth_stage=item["growth_stage"],
                        days_after_sowing=item["days_after_sowing"],
                        default_priority=item["default_priority"],
                        is_weather_sensitive=item["is_weather_sensitive"],
                        is_active=True,
                    )
                    db.add(tmpl)
                db.commit()
                logger.info(f"Successfully seeded {len(CURATED_TEMPLATES)} activity templates.")
        except Exception as e:
            db.rollback()
            logger.warning(f"Failed to auto-seed activity templates: {e}")

    @staticmethod
    def get_templates(
        db: Session,
        crop_name: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[ActivityTemplate]:
        """Fetch active templates filtered optionally by crop name and category."""
        ActivityTemplateService.ensure_templates_seeded(db)

        query = db.query(ActivityTemplate).filter(ActivityTemplate.is_active.is_(True))
        if crop_name:
            # Match specific crop or 'General' fallback
            crop_clean = crop_name.strip()
            query = query.filter(
                (ActivityTemplate.crop_name.ilike(f"%{crop_clean}%")) |
                (ActivityTemplate.crop_name == "General")
            )
        if category:
            query = query.filter(ActivityTemplate.category == category.lower().strip())

        return query.order_by(ActivityTemplate.crop_name, ActivityTemplate.days_after_sowing).all()
