
DELETE FROM [dbo].MBL_SpeciesSightingUploadFile
DBCC CHECKIDENT ('[dbo].[MBL_SpeciesSightingUploadFile]',RESEED, 0)

DELETE FROM [dbo].MBL_SpeciesSightingDetails
DBCC CHECKIDENT ('[dbo].[MBL_SpeciesSightingDetails]',RESEED, 0)

DELETE FROM [dbo].MBL_SightDetails
DBCC CHECKIDENT ('[dbo].[MBL_SightDetails]',RESEED, 0)

DELETE FROM [dbo].MBL_SightReportUser
DBCC CHECKIDENT ('[dbo].[MBL_SightReportUser]',RESEED, 0)

DELETE FROM [dbo].[SpeciesLookup]
DBCC CHECKIDENT ('[dbo].[SpeciesLookup]',RESEED, 0)

DELETE FROM [dbo].[LocationLookup]
DBCC CHECKIDENT ('[dbo].[LocationLookup]',RESEED, 0)
