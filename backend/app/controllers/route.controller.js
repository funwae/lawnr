import pool from "../../config/database.js";
import Job from "../models/Job.js";
import { optimizeRoute } from "../services/route_optimization.service.js";

/**
 * Optimize route for job locations
 * POST /api/routes/optimize
 * Body: { job_ids: string[] } or { waypoints: [{latitude, longitude, id?}] }
 */
export const optimizeJobRoute = async (req, res, next) => {
  try {
    const { job_ids, waypoints, start_index, use_2opt } = req.body;

    let waypointsToOptimize = [];

    // If job_ids provided, fetch job locations
    if (job_ids && Array.isArray(job_ids) && job_ids.length > 0) {
      const placeholders = job_ids.map((_, i) => `$${i + 1}`).join(",");
      const query = `
        SELECT j.id, p.latitude, p.longitude
        FROM jobs j
        JOIN properties p ON j.property_id = p.id
        WHERE j.id IN (${placeholders})
      `;
      const result = await pool.query(query, job_ids);

      if (result.rows.length !== job_ids.length) {
        return res.status(400).json({
          error: { message: "Some job IDs were not found" },
        });
      }

      waypointsToOptimize = result.rows.map((row) => ({
        id: row.id,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
      }));
    } else if (waypoints && Array.isArray(waypoints) && waypoints.length > 0) {
      // Use provided waypoints directly
      waypointsToOptimize = waypoints;
    } else {
      return res.status(400).json({
        error: {
          message: "Either job_ids or waypoints array is required",
        },
      });
    }

    if (waypointsToOptimize.length < 2) {
      return res.status(400).json({
        error: {
          message: "At least 2 waypoints are required for optimization",
        },
      });
    }

    // Optimize route
    const result = optimizeRoute(waypointsToOptimize, {
      startIndex: start_index || 0,
      use2Opt: use_2opt !== false, // Default to true
    });

    res.json({
      optimized_route: result.optimizedRoute,
      total_distance_km: result.totalDistance,
      estimated_time_minutes: result.estimatedTime,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get route for contractor's jobs
 * GET /api/routes/jobs?status=scheduled&contractor_id=xxx
 */
export const getContractorJobRoute = async (req, res, next) => {
  try {
    const { status, contractor_id } = req.query;

    if (!contractor_id) {
      return res.status(400).json({
        error: { message: "contractor_id is required" },
      });
    }

    // Get jobs for contractor
    const jobs = await Job.findByContractor(contractor_id, {
      status: status || undefined,
    });

    if (jobs.length < 2) {
      return res.json({
        jobs: jobs,
        route: null,
        message: "At least 2 jobs required for route optimization",
      });
    }

    // Get job locations
    const waypoints = [];
    for (const job of jobs) {
      const property = await pool.query(
        "SELECT latitude, longitude FROM properties WHERE id = $1",
        [job.property_id]
      );
      if (property.rows[0] && property.rows[0].latitude) {
        waypoints.push({
          id: job.id,
          latitude: parseFloat(property.rows[0].latitude),
          longitude: parseFloat(property.rows[0].longitude),
          job: job,
        });
      }
    }

    if (waypoints.length < 2) {
      return res.json({
        jobs: jobs,
        route: null,
        message: "Insufficient job locations for route optimization",
      });
    }

    // Optimize route
    const routeResult = optimizeRoute(waypoints, {
      use2Opt: true,
    });

    res.json({
      jobs: jobs,
      route: {
        optimized_route: routeResult.optimizedRoute,
        total_distance_km: routeResult.totalDistance,
        estimated_time_minutes: routeResult.estimatedTime,
      },
    });
  } catch (error) {
    next(error);
  }
};
