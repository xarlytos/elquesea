const Esqueleto = require('../models/Esqueleto');

exports.createEsqueleto = async (req, res) => {
    try {
      const { nombre, descripcion, semanas, plan } = req.body;
  
      const nuevoEsqueleto = new Esqueleto({
        nombre,
        descripcion,
        semanas,
        plan,
      });
  
      const esqueletoGuardado = await nuevoEsqueleto.save();
      res.status(201).json(esqueletoGuardado);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al crear el esqueleto', error });
    }
  };
  
  exports.getEsqueletos = async (req, res) => {
    try {
      const esqueletos = await Esqueleto.find();
      res.status(200).json(esqueletos);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener los esqueletos', error });
    }
  };
  exports.getEsqueletoById = async (req, res) => {
    try {
      const esqueleto = await Esqueleto.findById(req.params.id);
      if (!esqueleto) {
        return res.status(404).json({ mensaje: 'Esqueleto no encontrado' });
      }
      res.status(200).json(esqueleto);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener el esqueleto', error });
    }
  };
  exports.updateEsqueleto = async (req, res) => {
    try {
      const esqueletoActualizado = await Esqueleto.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!esqueletoActualizado) {
        return res.status(404).json({ mensaje: 'Esqueleto no encontrado' });
      }
      res.status(200).json(esqueletoActualizado);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al actualizar el esqueleto', error });
    }
  };
  exports.deleteEsqueleto = async (req, res) => {
    try {
      const esqueletoEliminado = await Esqueleto.findByIdAndDelete(req.params.id);
      if (!esqueletoEliminado) {
        return res.status(404).json({ mensaje: 'Esqueleto no encontrado' });
      }
      res.status(200).json({ mensaje: 'Esqueleto eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al eliminar el esqueleto', error });
    }
  };
  