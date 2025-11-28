import Property from '../models/Property.js';
import PropertyMedia from '../models/PropertyMedia.js';

export const createProperty = async (req, res, next) => {
  try {
    const property = await Property.create({
      ...req.body,
      owner_id: req.user.id
    });

    res.status(201).json({ property });
  } catch (error) {
    next(error);
  }
};

export const getProperties = async (req, res, next) => {
  try {
    const properties = await Property.findByOwner(req.user.id);
    res.json({ properties });
  } catch (error) {
    next(error);
  }
};

export const getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: { message: 'Property not found' } });
    }

    if (property.owner_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    res.json({ property });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: { message: 'Property not found' } });
    }

    if (property.owner_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const updated = await Property.update(req.params.id, req.body);
    res.json({ property: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: { message: 'Property not found' } });
    }

    if (property.owner_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    await Property.delete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPropertyMedia = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: { message: 'Property not found' } });
    }

    if (property.owner_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }

    const media = await PropertyMedia.findByProperty(req.params.id);
    res.json({ media });
  } catch (error) {
    next(error);
  }
};

